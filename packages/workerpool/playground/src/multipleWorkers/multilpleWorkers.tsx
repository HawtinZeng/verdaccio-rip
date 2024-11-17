import { Workerpool } from '@zenghawtin/workerpool';

export function MultilpleWorkers() {
  const w = new Workerpool();
  const r = w.exec(
    async (params: number[]) => {
      return await params.reduce((p, cu) => p + cu, 0);
    },
    [
      [1, 2, 3, 90, 10],
      [2, 1, 141, 124312],
      [3, 14],
      [6, 14123]
    ],
    { isBatch: true }
    // @ts-ignore
  );
  r?.then((d) => console.log(d));
  return <div>MultilpleWorkers123</div>;
}
