import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function fuzzySearch(text: string, pattern: string): boolean {
	// Convert both to lowercase for case-insensitivity
	const textLower = text.toLowerCase();
	const patternLower = pattern.toLowerCase();

	// Empty pattern matches everything
	if (!patternLower.trim()) return true;

	let textIndex = 0;
	let patternIndex = 0;

	// Try to find all characters of pattern in text, in order
	while (textIndex < textLower.length && patternIndex < patternLower.length) {
		if (textLower[textIndex] === patternLower[patternIndex]) {
			patternIndex++;
		}
		textIndex++;
	}

	// If we found all characters, it's a match
	return patternIndex === patternLower.length;
}

export function formatTimestamp(isoString: string): string {
	// Handle invalid date strings
	if (!isoString) return '';

	try {
		const utcTimestamp = isoString.endsWith('Z') ? isoString : isoString + 'Z';
		const date = new Date(utcTimestamp);

		// Check if date is valid
		if (isNaN(date.getTime())) {
			return 'Invalid date';
		}

		const now = new Date();
		const isToday =
			date.getDate() === now.getDate() &&
			date.getMonth() === now.getMonth() &&
			date.getFullYear() === now.getFullYear();

		if (isToday) {
			// Today - show only time (e.g., "2:30 PM")
			return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		} else {
			const yesterday = new Date(now);
			yesterday.setDate(yesterday.getDate() - 1);
			const isYesterday =
				date.getDate() === yesterday.getDate() &&
				date.getMonth() === yesterday.getMonth() &&
				date.getFullYear() === yesterday.getFullYear();

			if (isYesterday) {
				// Yesterday - show "Yesterday" and time
				return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
			} else {
				// Other days - show date and time
				return (
					date.toLocaleDateString([], {
						month: 'short',
						day: 'numeric'
					}) +
					', ' +
					date.toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit'
					})
				);
			}
		}
	} catch (e) {
		return 'Invalid date';
	}
}
