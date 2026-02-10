'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Users, LogIn, AlertTriangle, TrendingUp, Clock, Smartphone } from 'lucide-react';

interface LoginStats {
  totalLogins: number;
  successfulLogins: number;
  failedLogins: number;
  successRate: number;
  uniqueUsers: number;
  newUsers: number;
  returningUsers: number;
  socialLogins: number;
  credentialLogins: number;
  hourlyData: { hour: number; count: number }[];
  dailyData: { date: string; logins: number; unique: number }[];
  methodBreakdown: { method: string; count: number; percentage: number }[];
  failureReasons: { reason: string; count: number }[];
}

export default function LoginAnalytics() {
  const [stats, setStats] = useState<LoginStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchLoginStats();
  }, [timeRange]);

  const fetchLoginStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/login-analytics?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch login analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-2 text-gray-600">Login analytics laden...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-600">
        Geen login data beschikbaar
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Login Analytics</h2>
          <p className="text-gray-600">Inzicht in gebruikersgedrag en login patronen</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="24h">Laatste 24 uur</option>
          <option value="7d">Laatste 7 dagen</option>
          <option value="30d">Laatste 30 dagen</option>
          <option value="90d">Laatste 90 dagen</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Totaal Logins</h3>
            <LogIn className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLogins.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.successfulLogins} succesvol, {stats.failedLogins} gefaald
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Success Rate</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Van alle login pogingen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Unieke Gebruikers</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.newUsers} nieuw, {stats.returningUsers} terugkerend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Social vs Credentials</h3>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats.socialLogins / stats.totalLogins) * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Social logins ({stats.socialLogins})
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Login Methods */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Login Methodes</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.methodBreakdown.map((method) => (
                <div key={method.method} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-sm font-medium capitalize">{method.method}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{method.count}</div>
                    <div className="text-xs text-gray-500">{method.percentage.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Failure Reasons */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Faal Redenen
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.failureReasons.map((reason) => (
                <div key={reason.reason} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm font-medium">
                      {reason.reason === 'user_not_found' ? 'Gebruiker niet gevonden' :
                       reason.reason === 'wrong_password' ? 'Verkeerd wachtwoord' :
                       reason.reason}
                    </span>
                  </div>
                  <div className="text-sm font-semibold">{reason.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Activity */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Login Activiteit per Uur
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-1 mt-4">
            {stats.hourlyData.map((hour) => (
              <div key={hour.hour} className="text-center">
                <div 
                  className="bg-emerald-500 rounded-sm mb-1 mx-auto"
                  style={{ 
                    height: `${Math.max(4, (hour.count / Math.max(...stats.hourlyData.map(h => h.count))) * 60)}px`,
                    width: '20px'
                  }}
                ></div>
                <div className="text-xs text-gray-500">{hour.hour}:00</div>
                <div className="text-xs font-medium">{hour.count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Trend */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Dagelijkse Login Trend</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.dailyData.slice(-7).map((day) => (
              <div key={day.date} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <div className="font-medium">{new Date(day.date).toLocaleDateString('nl-NL')}</div>
                <div className="text-right">
                  <div className="font-semibold">{day.logins} logins</div>
                  <div className="text-sm text-gray-500">{day.unique} unieke gebruikers</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
