import { parseVoiceToEvent } from './voice-parser';

describe('Voice Parser', () => {
  test('should parse "BC hydro on August 15 at 5 pm" correctly', () => {
    const result = parseVoiceToEvent('BC hydro on August 15 at 5 pm');
    
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Bc hydro');
    
    // Check that it's August 15th
    const startDate = new Date(result!.start);
    expect(startDate.getMonth()).toBe(7); // August is month 7 (0-indexed)
    expect(startDate.getDate()).toBe(15);
    expect(startDate.getHours()).toBe(17); // 5 PM = 17 hours
    expect(startDate.getMinutes()).toBe(0);
  });

  test('should parse "Meeting on December 25 at 2pm" correctly', () => {
    const result = parseVoiceToEvent('Meeting on December 25 at 2pm');
    
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Meeting');
    
    // Check that it's December 25th
    const startDate = new Date(result!.start);
    expect(startDate.getMonth()).toBe(11); // December is month 11 (0-indexed)
    expect(startDate.getDate()).toBe(25);
    expect(startDate.getHours()).toBe(14); // 2 PM = 14 hours
    expect(startDate.getMinutes()).toBe(0);
  });

  test('should parse "Team meeting on Monday at 10am" correctly', () => {
    const result = parseVoiceToEvent('Team meeting on Monday at 10am');
    
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Team meeting');
    
    // Check that it's Monday
    const startDate = new Date(result!.start);
    expect(startDate.getDay()).toBe(1); // Monday is day 1
    expect(startDate.getHours()).toBe(10); // 10 AM = 10 hours
    expect(startDate.getMinutes()).toBe(0);
  });

  test('should parse "Lunch tomorrow at 12pm" correctly', () => {
    const result = parseVoiceToEvent('Lunch tomorrow at 12pm');
    
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Lunch');
    
    // Check that it's tomorrow
    const startDate = new Date(result!.start);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const resultDate = new Date(startDate);
    resultDate.setHours(0, 0, 0, 0);
    
    expect(resultDate.getTime()).toBe(tomorrow.getTime());
    expect(startDate.getHours()).toBe(12); // 12 PM = 12 hours
    expect(startDate.getMinutes()).toBe(0);
  });

  test('should return null for unparseable input', () => {
    const result = parseVoiceToEvent('This is not a valid event format');
    expect(result).toBeNull();
  });
}); 