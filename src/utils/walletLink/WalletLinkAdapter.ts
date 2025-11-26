export default interface WalletLinkAdapter {
  getWalletLink(params: {
    ticket_token: string,
    ticketHolderName: string,
    id: string
  }): string;
}