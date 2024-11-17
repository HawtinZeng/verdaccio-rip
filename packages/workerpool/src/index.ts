import DataWorker from 'web-worker:./worker.ts';

type Options = {
  isBatch: boolean;
};
export class Workerpool {
  workerNum: number = navigator.hardwareConcurrency;
  constructor() {
    if (!window.Worker) {
      throw new Error("can't find webworker");
    }
  }
  exec(method: (args: any[]) => Promise<any>, params: any[], op?: Options) {
    if (op?.isBatch) {
      const workload = Math.ceil(params.length / this.workerNum);
      const res: any[] = [];
      const functionString = method.toString();
      for (let workerIdx = 0; workerIdx < this.workerNum; workerIdx++) {
        const startParams = workerIdx * workload;
        let endParams = workerIdx * workload + workload - 1;
        endParams = endParams === startParams ? endParams + 1 : endParams;
        const p = params.slice(startParams, endParams);
        if (p.length === 0) continue;

        const worker = new DataWorker();
        worker.postMessage({ function: functionString, args: p, options: op });

        const singleRes = new Promise((resolve) => {
          worker.onmessage = (event: MessageEvent) => {
            worker.terminate();
            resolve(event.data);
          };
        });

        res.push(singleRes);
      }
      return Promise.all(res);
    } else {
      const dataWorker = new DataWorker();
      dataWorker.postMessage({ function: method.toString(), args: params, options: op });
      return new Promise((res) => {
        dataWorker.onmessage = (event: MessageEvent) => {
          res(event.data);
        };
      });
    }
  }
}
