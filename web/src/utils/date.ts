import { formatDistanceToNow as dateFnsFormatDistanceToNow, format as dateFnsFormat } from 'date-fns';

export function safeFormatDistanceToNow(dateStr: string | undefined | null): string {
    if (!dateStr) return 'some time';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'some time';
        return dateFnsFormatDistanceToNow(date);
    } catch (e) {
        return 'some time';
    }
}

export function safeFormat(dateStr: string | undefined | null, formatStr: string): string {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'N/A';
        return dateFnsFormat(date, formatStr);
    } catch (e) {
        return 'N/A';
    }
}
