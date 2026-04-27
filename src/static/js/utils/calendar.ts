export const Calendar = {
    // Date formatting
    format(date: Date): string {
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Check if a date is today
    isToday(date: Date): boolean {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    },

    // Get the start and end of the week (Sunday to Saturday)
    getWeekRange(date: Date): {start: Date, end: Date} {
        const day = date.getDay(); // 0 = Sunday
        const start = new Date(date);
        start.setDate(start.getDate() - day);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return {start, end};
    },

    // Get the current week's dates
    getCurrentWeek(): Date[] {
        const today = new Date();
        const weekRange = this.getWeekRange(today);
        const days: Date[] = [];
        
        for (let i = 0; i <= 6; i++) {
            const day = new Date(weekRange.start);
            day.setDate(day.getDate() + i);
            days.push(day);
        }
        
        return days;
    },

    // Check if a date is within the current week
    isCurrentWeek(date: Date): boolean {
        const weekRange = this.getWeekRange(new Date());
        const minDate = new Date(weekRange.start);
        const maxDate = new Date(weekRange.end);
        
        return (
            date >= minDate && 
            date <= maxDate
        );
    }
};
