// @ts-ignore

/* eslint-disable */
import { TarWriter } from '@gera2ld/tarjs';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { Alert, Button, Collapse } from '@mui/material';
import { Buffer } from 'buffer';
import * as pako from 'pako';
import React, { useRef } from 'react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Dispatch, Loading, PackageList, RootState } from '../..';
import { buildMetadata, generatePackageMetadata } from './generatePackageMetadata';

async function putFolder(
  folder: any,
  currentLoc: string = '',
  writer: TarWriter,
  skipFolder = false
) {
  currentLoc = skipFolder ? `${currentLoc}` : `${currentLoc}/${folder.name}`;

  for await (const handle of folder.values()) {
    if (handle.kind === 'file') {
      const content = (await handle.getFile()) as File;
      writer.addFile(`${currentLoc}/${handle.name}`, content);
    } else if (handle.kind === 'directory') {
      await putFolder(handle, currentLoc, writer);
    }
  }
  return writer;
}
const cat = (f) =>
  new Promise((resolve) =>
    Object.assign(new FileReader(), {
      onload() {
        resolve(this.result);
      },
    }).readAsText(f)
  );
async function saveUint8ArrayToFile(data: Uint8Array, filename: string) {
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function saveObjectAsJson(object, filename) {
  const jsonString = JSON.stringify(object, null, 2); // Convert object to JSON string
  const blob = new Blob([jsonString], { type: 'application/json' }); // Create a Blob
  const url = URL.createObjectURL(blob); // Create a URL for the Blob
  const a = document.createElement('a'); // Create an anchor element
  a.href = url; // Set the URL as the href
  a.download = filename; // Set the desired file name
  document.body.appendChild(a); // Append the anchor to the body
  a.click(); // Programmatically click the anchor to trigger the download
  document.body.removeChild(a); // Remove the anchor from the document
  URL.revokeObjectURL(url); // Revoke the Blob URL
}
const Home: React.FC = () => {
  const ref = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch<Dispatch>();
  const registry = useSelector((state: RootState) => state.configuration.config.base);

  async function clickUpload() {
    try {
      const writers: TarWriter[] = [];
      const pkgManifasts: any = [];

      const entryDir = await window.showDirectoryPicker();

      async function putWriter(handle) {
        const fileHandle = await handle.getFileHandle('package.json');
        const f = await fileHandle.getFile();
        const c = await cat(f);
        const pkgManifast = JSON.parse(c as string);

        const w = new TarWriter();
        pkgManifasts.push(pkgManifast);

        writers.push(w);
        await putFolder(handle, 'package', w, true);
      }

      if (entryDir.name === 'node_modules') {
        for (const handle of entryDir.values()) {
          if (handle.kind === 'directory') {
            if (handle.name.includes('@')) {
              for (const handle of entryDir.values()) {
                if (handle.kind === 'directory') {
                  await putWriter(handle);
                }
              }
            } else {
              await putWriter(handle);
            }
          }
        }
      } else if (entryDir.name.includes('@')) {
        for (const handle of entryDir.values()) {
          if (handle.kind === 'directory') {
            await putWriter(handle);
          }
        }
      } else {
        await putWriter(entryDir);
      }
      const buffers = await Promise.all(writers.map((w) => w.write())).then((allBlobs) =>
        Promise.all(allBlobs.map((blob) => blob.arrayBuffer()))
      );
      const arrayBuffer = buffers.map((b) => {
        const int8Arr = new Uint8Array(b);
        return pako.gzip(int8Arr, {})!;
      });
      arrayBuffer.map((b, i) => saveUint8ArrayToFile(b, pkgManifasts[i].name + '.tgz'));
      const metadatas = await Promise.all(
        arrayBuffer.map((d, idx) => {
          return buildMetadata(registry, pkgManifasts[idx], Buffer.from(d));
        })
      );

      const allRes = await Promise.all(
        metadatas.map((metadata) => dispatch.publish.publishAct(metadata as any))
      );
      setOpen(true);
      setTimeout(() => {
        setOpen(false);
      }, 3000);
    } catch (e) {
      console.log(e);
    }
  }

  useEffect(() => {
    if (ref.current !== null) {
      ref.current.setAttribute('webkitdirectory', '');
    }
  }, [ref]);
  const packages = useSelector((state: RootState) => state.packages.response);
  const isLoading = useSelector((state: RootState) => state?.loading?.models.packages);

  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    // @ts-ignore
    dispatch.packages.getPackages();
  }, [dispatch]);
  return (
    <div className="container content" data-testid="home-page-container">
      <Collapse in={open}>
        <Alert
          severity="success"
          style={{
            position: 'fixed',
            top: '100px',
            width: '600px',
            left: '50%',
            transform: 'translate(-50%, 0)',
          }}
        >
          发布成功
        </Alert>
      </Collapse>
      {isLoading ? <Loading /> : <PackageList packages={packages} />}

      <Button
        component="label"
        onClick={clickUpload}
        role={undefined}
        startIcon={<CloudUploadIcon />}
        style={{ position: 'fixed', bottom: '100px', right: '100px' }}
        tabIndex={-1}
        variant="contained"
      >
        {'上传 node_modules 或第三方依赖'}
      </Button>
    </div>
  );
};

export default Home;
