function log2(x: number): number {
  return Math.log2(x);
}

/**
 * Pads the length L using the Padmé algorithm
 * @param x unpadded object length
 * @returns the padded object length
 */
function padme(L: number): number {
    if (L <= 4) return L;

    const E = Math.floor(log2(L));
    const S = Math.floor(log2(E) + 1);
    const lastBits = E - S;
    const bitMask = (1 << lastBits) - 1;

    return (L + bitMask) & ~bitMask;
}

/**
 * Applies padding with Padme
 * @param data message 
 * @returns padded message
 */
export function applyPadding(data: Uint8Array): Uint8Array {
    const paddedLength = padme(data.length + 2);
    const result = new Uint8Array(paddedLength);

    result[0] = (data.length >> 8) & 0xff;
    result[1] = data.length & 0xff;

    result.set(data, 2);

    return result;
}

/**
 * Removes padding
 * @param padded 
 * @returns unpadded message
 */
export function removePadding(padded: Uint8Array): Uint8Array {
    const originalLength = (padded[0] << 8) | padded[1];
    return padded.slice(2, 2 + originalLength);
}