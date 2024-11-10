// URL.createObjectURL

type GroupParams = any[][];

function workerReturnWrapper(method: (...args: any[]) => Promise<any>) {
  // start the passed method
  this.onmessage((params) => {
    const res = method(params);
    res
      .then((resolvedRes) => {
        this.postMessage(resolvedRes);
      })
      .catch((errorMsg) => {
        this.postMessage(errorMsg);
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
    let dataObj = '(' + workerReturnWrapper + ')();'; // here is the trick to convert the above fucntion to string
    let blob = new Blob([dataObj.replace('"use strict";', '')]);

    // eslint-disable-next-line no-undef
    let blobURL = (window.URL ? URL : webkitURL).createObjectURL(blob);

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
