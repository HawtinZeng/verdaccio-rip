// @ts-ignore
/* eslint-disable */
const getTarball = (name: string): string => {
  const r = name.split('/');
  if (r.length === 1) {
    return r[0];
  } else {
    return r[1];
  }
};
export function generatePackageMetadata(
  pkgName: string,
  version = '1.0.0',
  distTags: any = { ['latest']: version }
): any {
  // @ts-ignore

  return {
    _id: pkgName,
    name: pkgName,
    'dist-tags': {
      ...distTags,
    },
    versions: {
      [version]: {
        name: pkgName,
        version: version,
        description: 'package generated',
        main: 'index.js',
        scripts: {
          test: 'echo "Error: no test specified" && exit 1',
        },
        keywords: [],
        author: {
          name: 'User NPM',
          email: 'user@domain.com',
        },
        license: 'ISC',
        dependencies: {
          verdaccio: '^2.7.2',
        },
        readme: '# test',
        readmeFilename: 'README.md',
        _id: `${pkgName}@${version}`,
        _npmVersion: '5.5.1',
        _npmUser: {
          name: 'foo',
        },
        dist: {
          tarball: `http:\/\/localhost:5555\/${pkgName}\/-\/${getTarball(pkgName)}-${version}.tgz`,
        },
      },
    },
    readme: '# test',
    _attachments: {
      [`${getTarball(pkgName)}-${version}.tgz`]: {
        content_type: 'application/octet-stream',
        data:
          'H4sIAAAAAAAAE+2W32vbMBDH85y/QnjQp9qxLEeBMsbGlocNBmN7bFdQ5WuqxJaEpGQdo//79KPeQsnI' +
          'w5KUDX/9IOvurLuz/DHSjK/YAiY6jcXSKjk6sMqypHWNdtmD6hlBI0wqQmo8nVbVqMR4OsNoVB66kF1a' +
          'W8eML+Vv10m9oF/jP6IfY4QyyTrILlD2eqkcm+gVzpdrJrPz4NuAsULJ4MZFWdBkbcByI7R79CRjx0Sc' +
          'CdnAvf+SkjUFWu8IubzBgXUhDPidQlfZ3BhlLpBUKDiQ1cDFrYDmKkNnZwjuhUM4808+xNVW8P2bMk1Y' +
          '7vJrtLC1u1MmLPjBF40+Cc4ahV6GDmI/DWygVRpMwVX3KtXUCg7Sxp7ff3nbt6TBFy65gK1iffsN41yo' +
          'EHtdFbOiisWMH8bPvXUH0SP3k+KG3UBr+DFy7OGfEJr4x5iWVeS/pLQe+D+FIv/agIWI6GX66kFuIhT+' +
          '1gDjrp/4d7WAvAwEJPh0u14IufWkM0zaW2W6nLfM2lybgJ4LTJ0/jWiAK8OcMjt8MW3OlfQppcuhhQ6k' +
          '+2OgkK2Q8DssFPi/IHpU9fz3/+xj5NjDf8QFE39VmE4JDfzPCBn4P4X6/f88f/Pu47zomiPk2Lv/dOv8' +
          'h+P/34/D/p9CL+Kp67mrGDRo0KBBp9ZPsETQegASAAA=+2W32vbMBDH85y',
        length: 512,
      },
    },
    _uplinks: {},
    _distfiles: {},
    _rev: '',
  };
}
export const buildMetadata = async (registry, manifest, tarballData) => {
  const defaultTag = 'adam';
  const root = {
    _id: manifest.name,
    name: manifest.name,
    description: manifest.description,
    'dist-tags': {},
    versions: {},
    access: 'default',
  };

  root.versions[manifest.version] = manifest;
  const tag = manifest.tag || defaultTag;
  root['dist-tags'][tag] = manifest.version;

  const tarballName = `${manifest.name}-${manifest.version}.tgz`;
  const tarballURI = `${manifest.name}/-/${tarballName}`;

  manifest._id = `${manifest.name}@${manifest.version}`;
  manifest.dist = { ...manifest.dist };

  manifest.dist.tarball = new URL(tarballURI, registry).href.replace(/^https:\/\//, 'http://');

  (root as any)._attachments = {};
  (root as any)._attachments[tarballName] = {
    content_type: 'application/octet-stream',
    data: tarballData.toString('base64'),
    length: tarballData.length,
  };
  (root as any).readme = manifest.readme;
  console.log(root);
  return root;
};
