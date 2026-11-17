import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  copyDayWindows,
  dayScheduleError,
  decodeDaySchedule,
  encodeDaySchedule,
} from '@/lib/delivery/day-schedule';

describe('day schedule encode and copy', () => {
  it('keeps Monday when Thursday changes', () => {
    const schedule = decodeDaySchedule(
      ['maandag@09:00-12:00', 'maandag@14:00-17:00', 'donderdag@14:00-18:30'],
      ['maandag', 'donderdag'],
    );
    schedule.donderdag = [{ start: '15:00', end: '16:00' }];
    const encoded = encodeDaySchedule(['maandag', 'donderdag'], schedule);
    assert.deepEqual(encoded, [
      'maandag@09:00-12:00',
      'maandag@14:00-17:00',
      'donderdag@15:00-16:00',
    ]);
  });

  it('copies only onto the days the courier picks', () => {
    const schedule = {
      maandag: [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '17:00' },
      ],
      dinsdag: [],
      woensdag: [],
      donderdag: [{ start: '14:00', end: '18:30' }],
      vrijdag: [],
      zaterdag: [],
      zondag: [],
    };
    const copied = copyDayWindows(schedule, 'maandag', ['donderdag']);
    assert.deepEqual(copied.donderdag, schedule.maandag);
    assert.deepEqual(copied.dinsdag, []);
    assert.equal(dayScheduleError([{ start: '17:00', end: '14:00' }]), 'De eindtijd moet na de begintijd liggen.');
    assert.equal(
      dayScheduleError([
        { start: '09:00', end: '12:00' },
        { start: '11:00', end: '13:00' },
      ]),
      'Deze tijdvakken overlappen.',
    );
  });

  it('drops a disabled day from the stored windows', () => {
    const encoded = encodeDaySchedule(['maandag'], {
      maandag: [{ start: '09:00', end: '12:00' }],
      dinsdag: [{ start: '09:00', end: '12:00' }],
      woensdag: [],
      donderdag: [],
      vrijdag: [],
      zaterdag: [],
      zondag: [],
    });
    assert.deepEqual(encoded, ['maandag@09:00-12:00']);
  });
});
