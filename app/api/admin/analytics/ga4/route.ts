import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAnalyticsDataClient, getPropertyId, parseDateRange } from '@/lib/google-analytics';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/analytics/ga4
 * 
 * Haal Google Analytics 4 data op met uitgebreide filtering mogelijkheden
 * 
 * Query parameters:
 * - range: date range (24h, 7d, 30d, 90d, 1y) of custom (startDate-endDate)
 * - metrics: comma-separated list of metrics (default: activeUsers,screenPageViews)
 * - dimensions: comma-separated list of dimensions (optional)
 * - filters: JSON string with filter configuration (optional)
 * - limit: max results (default: 100)
 * - orderBy: ordering configuration (optional)
 * - export: csv|json (optional - triggers export)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    
    // Get query parameters
    const range = searchParams.get('range') || '7d';
    const metricsParam = searchParams.get('metrics') || 'activeUsers,screenPageViews';
    const dimensionsParam = searchParams.get('dimensions') || '';
    const filtersParam = searchParams.get('filters');
    const limit = parseInt(searchParams.get('limit') || '100');
    const orderByParam = searchParams.get('orderBy');
    const exportFormat = searchParams.get('export'); // csv|json

    // Parse date range
    const { startDate, endDate } = parseDateRange(range);

    // Parse metrics
    const metrics = metricsParam.split(',').map(m => m.trim());

    // Parse dimensions (optional)
    const dimensions = dimensionsParam 
      ? dimensionsParam.split(',').map(d => d.trim()).filter(Boolean)
      : [];

    // Parse filters (optional)
    let dimensionFilter: any = undefined;
    if (filtersParam) {
      try {
        const filters = JSON.parse(filtersParam);
        if (filters.dimension && filters.operator && filters.value) {
          dimensionFilter = {
            filter: {
              fieldName: filters.dimension,
              stringFilter: {
                matchType: filters.operator === 'contains' ? 'CONTAINS' :
                          filters.operator === 'exact' ? 'EXACT' :
                          filters.operator === 'startsWith' ? 'BEGINS_WITH' :
                          'CONTAINS',
                value: filters.value,
                caseSensitive: filters.caseSensitive || false,
              },
            },
          };
        }
      } catch (error) {
        console.error('Failed to parse filters:', error);
      }
    }

    // Parse orderBy (optional)
    let orderBys: any = undefined;
    if (orderByParam) {
      try {
        const orderByConfig = JSON.parse(orderByParam);
        orderBys = [{
          metric: {
            metricName: orderByConfig.metric || metrics[0],
          },
          desc: orderByConfig.desc !== false,
        }];
      } catch (error) {
        // Use default ordering
        orderBys = [{
          metric: {
            metricName: metrics[0],
          },
          desc: true,
        }];
      }
    } else {
      // Default ordering by first metric descending
      orderBys = [{
        metric: {
          metricName: metrics[0],
        },
        desc: true,
      }];
    }

    // Get Analytics Data client
    const client = getAnalyticsDataClient();
    if (!client) {
      return NextResponse.json(
        { 
          error: 'Google Analytics Data API not configured',
          message: 'Please set up GOOGLE_ANALYTICS_PROJECT_ID, GOOGLE_ANALYTICS_CLIENT_EMAIL, and GOOGLE_ANALYTICS_PRIVATE_KEY'
        },
        { status: 503 }
      );
    }

    const propertyId = `properties/${getPropertyId()}`;

    // Build request
    const request: any = {
      property: propertyId,
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      dimensions: dimensions.length > 0 ? dimensions.map(name => ({ name })) : undefined,
      metrics: metrics.map(name => ({ name })),
      limit,
      orderBys,
      dimensionFilter,
    };

    // Execute query
    const [response] = await client.runReport(request);

    // Transform response
    const result = {
      dateRange: { startDate, endDate },
      metrics: response.metricHeaders?.map(h => ({
        name: h.name,
        type: h.type,
      })) || [],
      dimensions: response.dimensionHeaders?.map(h => ({
        name: h.name,
      })) || [],
      rows: response.rows?.map(row => {
        const rowData: any = {};
        
        // Add dimension values
        row.dimensionValues?.forEach((value, index) => {
          const dimension = response.dimensionHeaders?.[index];
          if (dimension && dimension.name) {
            rowData[dimension.name] = value.value;
          }
        });
        
        // Add metric values
        row.metricValues?.forEach((value, index) => {
          const metric = response.metricHeaders?.[index];
          if (metric && metric.name) {
            rowData[metric.name] = parseFloat(value.value || '0');
          }
        });
        
        return rowData;
      }) || [],
      rowCount: response.rows?.length || 0,
      totals: response.totals?.[0]?.metricValues?.map((value, index) => ({
        metric: response.metricHeaders?.[index]?.name,
        value: parseFloat(value.value || '0'),
      })) || [],
    };

    // Handle export
    if (exportFormat === 'csv') {
      return exportToCSV(result);
    }

    if (exportFormat === 'json') {
      return NextResponse.json(result, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="ga4-export-${startDate}-${endDate}.json"`,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching GA4 data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch GA4 data',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Export data to CSV format
 */
function exportToCSV(data: any): NextResponse {
  const { dateRange, metrics, dimensions, rows } = data;

  // Build CSV header
  const headers = [
    ...dimensions.map((d: any) => d.name),
    ...metrics.map((m: any) => m.name),
  ];
  const csvRows = [headers.join(',')];

  // Add data rows
  rows.forEach((row: any) => {
    const values = [
      ...dimensions.map((d: any) => `"${String(row[d.name] || '').replace(/"/g, '""')}"`),
      ...metrics.map((m: any) => String(row[m.name] || '0')),
    ];
    csvRows.push(values.join(','));
  });

  const csv = csvRows.join('\n');
  const filename = `ga4-export-${dateRange.startDate}-${dateRange.endDate}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

