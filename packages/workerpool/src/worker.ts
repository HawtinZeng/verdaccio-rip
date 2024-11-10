self.onmessage = ({ data }) => {
  console.log(`echo from worker: ${data}`);
  // self.postMessage(`echo: ${data}`);
  // const func = new Function('return' + data.function)();
  // const args = data.args;

  // const options = data.options;
  // if (options.isBatch) {
  //   const task = args.map((arg) => func(...arg));
  //   Promise.all(task).then((r) => {
  //     self.postMessage(r);
  //   });
  // }f
};
