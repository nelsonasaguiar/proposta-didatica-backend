export function isPlateNumberFormat(str: string): boolean {
   return /^[a-zA-Z0-9]{2}-[a-zA-Z0-9]{2}-[a-zA-Z0-9]{2}$/.test(str);
}