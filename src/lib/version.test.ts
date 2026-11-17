import { versionLines } from './version';

const hash = '1a2b3c4d5e6f7a8b9c0d1a2b3c4d5e6f7a8b9c0d';

describe('versionLines', () => {
  it('shows only the version in the public app', () => {
    expect(versionLines({ where: 'phone', version: '0.1.0', embedded: true, runtimeVersion: hash }, false)).toEqual([
      'Version 0.1.0',
    ]);
  });

  it('says when the preview app runs the code that came with its build', () => {
    expect(versionLines({ where: 'phone', version: '0.1.0', embedded: true, runtimeVersion: hash }, true)).toEqual([
      'Version 0.1.0',
      'The code that came with this build',
      'Fingerprint 1a2b3c4',
    ]);
  });

  it('gives the day and time of an update in the preview app', () => {
    const createdAt = new Date(2026, 10, 17, 15, 48);
    expect(versionLines({ where: 'phone', version: '0.1.0', embedded: false, createdAt, runtimeVersion: hash }, true)).toEqual([
      'Version 0.1.0',
      'Update of 17 November, 15:48',
      'Fingerprint 1a2b3c4',
    ]);
  });

  it('writes the hour with two figures', () => {
    const createdAt = new Date(2027, 0, 2, 9, 5);
    expect(versionLines({ where: 'phone', version: '0.1.0', embedded: false, createdAt }, true)[1]).toBe(
      'Update of 2 January, 09:05',
    );
  });

  it('leaves out what it does not know (a development run)', () => {
    expect(versionLines({ where: 'phone', version: '0.1.0', embedded: false }, true)).toEqual(['Version 0.1.0']);
  });

  it('says "Web preview" on the web', () => {
    expect(versionLines({ where: 'web', version: '0.1.0' }, true)).toEqual(['Version 0.1.0', 'Web preview']);
  });
});
