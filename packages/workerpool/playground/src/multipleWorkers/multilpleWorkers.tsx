import { Workerpool } from '@zenghawtin/workerpool';

export function MultilpleWorkers() {
  const w = new Workerpool();

  w.exec(
    async (params: number[]) => {
      return await params.reduce((p, cu) => p + cu, 0);
    },

    [1, 2, 3, 6]
    // @ts-ignore
  ).then((d) => console.log(d));
  return <div>MultilpleWorkers123</div>;
}
