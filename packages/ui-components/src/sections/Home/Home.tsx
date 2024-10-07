// @ts-ignore

/* eslint-disable */
import { TarWriter } from '@gera2ld/tarjs';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import {
  Alert,
  Box,
  Button,
  Collapse,
  LinearProgress,
  LinearProgressProps,
  Typography,
} from '@mui/material';
import { Buffer } from 'buffer';
import * as pako from 'pako';
import React, { useRef, useState } from 'react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Dispatch, Loading, PackageList, RootState } from '../..';
import { buildMetadata, generatePackageMetadata } from './generatePackageMetadata';

function LinearProgressWithLabel(props: LinearProgressProps & { value: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {`${Math.round(props.value)}%`}
        </Typography>
      </Box>
    </Box>
  );
}
async function putFolder(
  folder: any,
  currentLoc: string = '',
  writer: TarWriter,
  skipFolder = false
) {
  currentLoc = skipFolder ? `${currentLoc}` : `${currentLoc}/${folder.name}`;

  for await (const handle of folder.values()) {
    if (handle.kind === 'file') {
      let content;
      try {
        content = (await handle.getFile()) as File;
      } catch (e) {
        console.log(e);
        continue;
      }
      writer.addFile(`${currentLoc}/${handle.name}`, content);
    } else if (handle.kind === 'directory') {
      await putFolder(handle, currentLoc, writer);
    }
  }
  return writer;
}
const cat = (f) =>
  new Promise((resolve) =>
    // @ts-ignore
    Object.assign(new FileReader(), {
      onload() {
        // @ts-ignore
        resolve(this.result);
      },
    }).readAsText(f)
  );
async function saveUint8ArrayToFile(data: Uint8Array, filename: string) {
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  // @ts-ignore
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  // @ts-ignore
  document.body.appendChild(a);
  a.click();
  // @ts-ignore
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function saveObjectAsJson(object, filename) {
  const jsonString = JSON.stringify(object, null, 2); // Convert object to JSON string
  const blob = new Blob([jsonString], { type: 'application/json' }); // Create a Blob
  const url = URL.createObjectURL(blob); // Create a URL for the Blob
  // @ts-ignore
  const a = document.createElement('a'); // Create an anchor element
  a.href = url; // Set the URL as the href
  a.download = filename; // Set the desired file name
  // @ts-ignore
  document.body.appendChild(a); // Append the anchor to the body
  a.click(); // Programmatically click the anchor to trigger the download
  // @ts-ignore
  document.body.removeChild(a); // Remove the anchor from the document
  URL.revokeObjectURL(url); // Revoke the Blob URL
}
const Home: React.FC = () => {
  const ref = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch<Dispatch>();
  const registry = useSelector((state: RootState) => state.configuration.config.base);
  const [publishProcess, setpublishProcess] = useState(0);

  const [open, setOpen] = React.useState(false);
  const [publishing, setpublishing] = React.useState(false);
  const [total, sTotal] = useState(0);
  const [successPkg, ssuccessPkg] = useState(0);
  const [failedPkg, sfailedPkg] = useState(0);

  async function clickUpload() {
    try {
      const writers: TarWriter[] = [];
      const pkgManifasts: any = [];

      console.time('load directory');
      // @ts-ignore
      const entryDir = await window.showDirectoryPicker();
      // start scan dir
      setpublishing(true);
      async function putWriter(handle) {
        try {
          if (handle.name.split('')[0] === '.') return; // skip .bin, .pnpm
          let fileHandle;
          try {
            fileHandle = await handle.getFileHandle('package.json'); // skip without package.json
          } catch (e) {
            return;
          }
          console.log('putWriter');
          // handle nested dependencies
          try {
            const node_modules = await handle.getDirectoryHandle('node_modules');
            for await (const handle of node_modules.values()) {
              if (handle.name.includes('@')) {
                for await (const handleN of handle.values()) {
                  if (handleN.kind === 'directory') {
                    await putWriter(handleN);
                  }
                }
              } else {
                await putWriter(handle);
              }
            }
          } catch (e) {}

          const f = await fileHandle.getFile();
          const c = await cat(f);
          // console.log(c);
          const pkgManifast = JSON.parse(c as string);

          try {
            const readmeHandle = await handle.getFileHandle('README.md');
            const f = await readmeHandle.getFile();
            const c = await cat(f);
            pkgManifast.readme = c;
          } catch (e) {}
          const w = new TarWriter();
          pkgManifasts.push(pkgManifast);
          writers.push(w);
          await putFolder(handle, 'package', w, true);
        } catch (e) {
          console.log(e);
          console.log(`error: ${handle.name}`);
        }
      }

      if (entryDir.name === 'node_modules') {
        let totalSize = 0;
        let totalAte = 0;

        for await (const _ of entryDir.values()) {
          totalSize++;
        }
        for await (const handle of entryDir.values()) {
          if (handle.name.includes('@')) {
            for await (const handleN of handle.values()) {
              if (handleN.kind === 'directory') {
                await putWriter(handleN);
              }
            }
          } else {
            await putWriter(handle);
          }
          totalAte++;
          setpublishProcess((totalAte / totalSize) * 40);
        }
      } else if (entryDir.name.includes('@')) {
        for await (const handle of entryDir.values()) {
          if (handle.kind === 'directory') {
            await putWriter(handle);
          }
        }
      } else {
        await putWriter(entryDir);
      }

      console.timeEnd('load directory');

      console.time('generate tgz');
      let ate = 0;
      const total = writers.length;

      const arrayBuffer = await Promise.all(
        writers.map((w) =>
          w
            .write()
            .then((blob) => {
              return blob.arrayBuffer();
            })
            .then((b) => {
              const int8Arr = new Uint8Array(b);
              const res = pako.gzip(int8Arr, {})!;

              ate++;
              setpublishProcess(40 + (ate / total) * 40);

              return res;
            })
        )
      );
      console.timeEnd('generate tgz');

      // For debug:
      // arrayBuffer.map((b, i) => saveUint8ArrayToFile(b, pkgManifasts[i].name + '.tgz'));
      console.time('send to server');
      const metadatas = await Promise.all(
        arrayBuffer.map((d, idx) => {
          return buildMetadata(registry, pkgManifasts[idx], Buffer.from(d));
        })
      );
      const count = metadatas.length;
      let cur = 0;
      let failed = 0;

      await Promise.all(
        metadatas.map((metadata) => {
          const p = dispatch.publish.publishAct(metadata as any);
          return p.then((res) => {
            console.log(res);
            if (res === undefined) failed++;
            cur++;
            setpublishProcess(80 + (cur / count) * 20);
          });
        })
      );
      console.timeEnd('send to server');

      setpublishing(false);

      sTotal(count);
      sfailedPkg(failed);
      ssuccessPkg(count - failed);
      setOpen(true);

      setTimeout(() => {
        setOpen(false);
        // @ts-ignore
        if (count - failed > 0) dispatch.packages.getPackages();
      }, 3000);
    } catch (e) {}
  }

  useEffect(() => {
    if (ref.current !== null) {
      ref.current.setAttribute('webkitdirectory', '');
    }
  }, [ref]);
  const packages = useSelector((state: RootState) => state.packages.response);
  const isLoading = useSelector((state: RootState) => state?.loading?.models.packages);

  useEffect(() => {
    // @ts-ignore
    dispatch.packages.getPackages();
  }, [dispatch]);
  return (
    <div className="container content" data-testid="home-page-container">
      {publishing ? (
        <div
          style={{
            position: 'fixed',
            width: '300px',
            height: '50px',
            bottom: '200px',
            right: '50px',
          }}
        >
          <LinearProgressWithLabel value={publishProcess} />
        </div>
      ) : null}
      <Collapse
        in={open}
        style={{ position: 'fixed', width: '250px', bottom: '300px', right: '50px' }}
      >
        <Alert severity="success">
          <div style={{ color: 'green' }}>本轮成功个数{`${successPkg}`}</div>
          <div style={{ color: 'red' }}>本轮失败个数{`${failedPkg}`}</div>
          <div style={{ color: 'black' }}>本轮上传总数{`${total}`}</div>
        </Alert>
      </Collapse>
      {isLoading ? <Loading /> : <PackageList packages={packages} />}

      <Button
        component="label"
        onClick={clickUpload}
        role={undefined}
        startIcon={<CloudUploadIcon />}
        style={{ position: 'fixed', bottom: '100px', right: '50px' }}
        tabIndex={-1}
        variant="contained"
      >
        {'上传 node_modules 或第三方依赖'}
      </Button>
    </div>
  );
};

export default Home;
