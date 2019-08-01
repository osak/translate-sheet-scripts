import FromOldSpreadsheet from '../../converter/fromOldSpreadsheet';
import TestResource from '../testResource';

describe(`class FromOldSpreadsheet`, () => {
  describe(`FromOldSpreadsheet#convert`, () => {
    it('do', () => {
      const sheet = [
        ['strings', 'Sayori', 'サヨリ'],
        ['ch0_main_41e273ca', 's "Heeeeeeeyyy!!"', 's "「おーはーよーーー！」"'],
        [
          'ch3_end_sayori_dd9616f1',
          `m "${TestResource.nointeractDialog.orifinal}" nointeract`,
          `m "${TestResource.nointeractDialog.translate}" nointeract`,
        ],
        ['ch0_main_cb634d94', TestResource.longDialog.orifinal, TestResource.longDialog.translate],
        [
          'CAN YOU HEAR ME.txt',
          TestResource.fileContent.orifinal,
          TestResource.fileContent.translate,
        ],
      ];
      expect(FromOldSpreadsheet.convert(sheet)).toMatchObject([
        { id: '', attribute: 'strings', original: 'Sayori', translate: 'サヨリ' },
        {
          id: 'ch0_main_41e273ca',
          attribute: 's',
          original: 'Heeeeeeeyyy!!',
          translate: '「おーはーよーーー！」',
        },
        {
          id: 'ch3_end_sayori_dd9616f1',
          attribute: 'm nointeract',
          original: TestResource.nointeractDialog.orifinal,
          translate: TestResource.nointeractDialog.translate,
        },
        {
          id: 'ch0_main_cb634d94',
          attribute: '',
          original: TestResource.longDialog.orifinal,
          translate: TestResource.longDialog.translate,
        },
        {
          id: 'CAN YOU HEAR ME.txt',
          attribute: 'file',
          original: TestResource.fileContent.orifinal,
          translate: TestResource.fileContent.translate,
        },
      ]);
    });
  });
});
