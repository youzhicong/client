export type SealParty = 'partyA' | 'partyB'
export const createElectronicSealData = (
  label: string,
  party: SealParty = 'partyA'
) => {
  const color = party === 'partyA' ? '#dc2626' : '#2563eb'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220"><circle cx="110" cy="110" r="96" fill="none" stroke="${color}" stroke-width="6"/><text x="110" y="110" text-anchor="middle" fill="${color}" font-size="16" font-weight="700">${label.slice(0, 8)}</text><text x="110" y="140" text-anchor="middle" fill="${color}" font-size="12">电子签章</text></svg>`
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}
