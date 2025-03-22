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
