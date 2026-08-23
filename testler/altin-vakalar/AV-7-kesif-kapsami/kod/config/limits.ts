export const LIMITLER = {
  gunlukTransfer: Number(process.env.REACT_APP_GUNLUK_LIMIT ?? 50000),
  tekIslem: Number(process.env.REACT_APP_TEK_ISLEM_LIMIT ?? 20000),
};
