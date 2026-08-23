export function HesapOzeti() {
  const { data } = useQuery(['ozet'], hesapApi.ozet);
  return <OzetKarti data={data} />;
}
