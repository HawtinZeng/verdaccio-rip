import DataWorker from 'web-worker:./worker.ts';

type GroupParams = any[][];

function workerReturnWrapper(this: any, method: (...args: any[]) => Promise<any>) {
  this.addEventListener('message', ({ data: params }) => {
    const res: any = [];
    console.log(`params: ${params}`);
    params.forEach((oneParam) => {
      const oneRes = method(oneParam);
      oneRes
        .then((resolvedRes) => {
          res.push(resolvedRes);
        })
        .catch((errorMsg) => {
          res.push(errorMsg);
        })
        .finally(() => {
          if (res.length === params.length) {
            this.postMessage(res);
          }
        });
    });
  });
}

export class Workerpool {
  workerNum: number = navigator.hardwareConcurrency;
  constructor() {
    if (!window.Worker) {
      throw new Error("can't find webworker");
    }
  }

  exec(method: (...args: any) => Promise<any>, params: GroupParams) {
    const dataWorker = new DataWorker();

    dataWorker.postMessage('Hello World!');
    // const workload = Math.ceil(params.length / this.workerNum);
    // const res: any[] = [];
    // for (let workerIdx = 0; workerIdx < this.workerNum; workerIdx++) {
    //   const startParams = workerIdx * workload;
    //   let endParams = workerIdx * workload + workload - 1;
    //   endParams = endParams === startParams ? endParams + 1 : endParams;
    //   const p = params.slice(startParams, endParams);
    //   const worker = new Worker('worker.js');
    //   console.log(`p: ${p}`);
    //   worker.postMessage(p);
    //   worker.onmessage = (event: MessageEvent) => {
    //     worker.terminate();
    //     res.push(event.data);
    //   };
    // }
  }
}
