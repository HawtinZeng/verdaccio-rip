import { Workerpool } from '@zenghawtin/workerpool';

export function MultilpleWorkers() {
  const w = new Workerpool();
  w.exec(
    (params: []) => {
      params.reduce((p, cu) => p + cu, 0);
    },
    [
      [1, 2, 3, 4],
      [1, 2, 3, 4],
      [1, 2, 3, 4],
      [1, 2, 3, 4],
      [1, 2, 3, 4],
      [1, 2, 3, 4]
    ]
  );
  return <div>MultilpleWorkers</div>;
}
