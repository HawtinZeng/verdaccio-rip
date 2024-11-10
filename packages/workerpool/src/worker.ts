self.onmessage = ({ data }: any) => {
  console.log(data);
  const func = eval('(' + data.function + ')');

  const args = data.args;
  const options = data.options;
  if (options?.isBatch) {
    const task = args.map((arg: any[]) => func(arg));
    Promise.all(task).then((r) => {
      self.postMessage(r);
    });
  } else {
    func(args).then((res) => {
      self.postMessage(res);
    });
  }
};
