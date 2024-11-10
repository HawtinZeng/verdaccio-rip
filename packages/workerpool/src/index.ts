type GroupParams = any[][];
function workerReturnWrapper(this: any, method: (...args: any[]) => Promise<any>) {
  console.log(this);
  this.onmessage((params) => {
    const res: any = [];
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

  exec(method: Function, params: GroupParams) {
    const dataObj = '(' + workerReturnWrapper + ')();';
    const blob = new Blob([dataObj]);

    // eslint-disable-next-line no-undef
    const blobURL = (window.URL ? URL : webkitURL).createObjectURL(blob);

    const workload = Math.ceil(params.length / this.workerNum);
    const res: any[] = [];

    for (let workerIdx = 0; workerIdx < this.workerNum; workerIdx++) {
      const startParams = workerIdx * workload;
      let endParams = workerIdx * workload + workload - 1;
      endParams = endParams === startParams ? endParams + 1 : endParams;

      const p = params.slice(startParams, endParams);
      const worker = new Worker(blobURL);
      worker.postMessage(p);
      worker.onmessage = (event: MessageEvent) => {
        worker.terminate();
        res.push(event.data);
      };
    }
  }
}
