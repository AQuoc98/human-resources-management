import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseText } from '../lib/citizen-id/data.ts';

test('Vietnamese front and back with adjacent lines and multiline residence', () => {
  const text = `Số / No.
001234567890
HỌ VÀ TÊN / Full name
NGUYỄN VĂN AN
Ngày sinh / Date of birth
01/02/1990
Giới tính / Sex
Nữ
Quê quán / Place of origin
Hà Nội
Nơi thường trú / Place of residence
Số 1, Phố A
Phường B, Quận C
Đặc điểm nhận dạng / Personal identification
Nốt ruồi
Ngày cấp
01/03/2020
CỤC TRƯỞNG CỤC CẢNH SÁT QUẢN LÝ HÀNH CHÍNH VỀ TRẬT TỰ XÃ HỘI`;
  assert.deepEqual(parseText(text), { number:'001234567890', name:'NGUYỄN VĂN AN', birth:'01/02/1990', sex:'Nữ', residence:'Số 1, Phố A, Phường B, Quận C', issue:'01/03/2020', authority:'CỤC TRƯỞNG CỤC CẢNH SÁT QUẢN LÝ HÀNH CHÍNH VỀ TRẬT TỰ XÃ HỘI' });
});
test('same-line labels, bilingual labels and normalized dates', () => {
  assert.deepEqual(parseText('Số: 001234567890\nHọ và tên/Full name: Nguyễn Thị Ánh\nNgày sinh 1-2-1990\nGiới tính: Nam\nNơi thường trú: Hà Nội\nNgày cấp: 3.4.2021\nNơi cấp: Bộ Công An'), {number:'001234567890',name:'Nguyễn Thị Ánh',birth:'01/02/1990',sex:'Nam',residence:'Hà Nội',issue:'03/04/2021',authority:'Bộ Công An'});
});
test('unlabelled number and issue date block', () => {
  assert.deepEqual(parseText('001234567890\nNgày 02 tháng 03 năm 2020\nCỤC CẢNH SÁT QUẢN LÝ HÀNH CHÍNH VỀ TRẬT TỰ XÃ HỘI'), {number:'001234567890',issue:'02/03/2020',authority:'CỤC CẢNH SÁT QUẢN LÝ HÀNH CHÍNH VỀ TRẬT TỰ XÃ HỘI'});
});
test('missing and conflicting fields do not produce guesses', () => {
  assert.deepEqual(parseText('Quê quán\nHà Nội\nNgày sinh: 31/02/2000\nGiới tính: không rõ'), {});
  assert.deepEqual(parseText('Họ và tên: An\nHọ và tên: Bình\nSố: 001234567890\nSố: 001234567891'), {});
  assert.deepEqual(parseText('unrelated text'), {});
});

test('matches OCR-damaged label accents while preserving values', () => {
  assert.deepEqual(parseText('Ngay sinh / Date of birth\n01/02/1990\nGiới tinh / Sex\nNữ\nCỤC TRƯỞNG CỤC CẢNH SÁT QUAN LÝ\nHANH CHÍNH VỀ TRAT TỰ XÃ HỘI'), {birth:'01/02/1990',sex:'Nữ',authority:'CỤC TRƯỞNG CỤC CẢNH SÁT QUAN LÝ, HANH CHÍNH VỀ TRAT TỰ XÃ HỘI'});
});

test('image enhancement stretches low-contrast synthetic pixels and preserves alpha', async () => {
  const { enhancePixels } = await import('../lib/citizen-id/image.ts');
  const pixels = new Uint8ClampedArray([50, 50, 50, 255, 100, 100, 100, 127, 150, 150, 150, 255]);
  enhancePixels(pixels);
  assert.deepEqual([...pixels], [0, 0, 0, 255, 128, 128, 128, 127, 255, 255, 255, 255]);
  const uniform = new Uint8ClampedArray([80, 80, 80, 255, 80, 80, 80, 255]);
  enhancePixels(uniform);
  assert.deepEqual([...uniform], [80, 80, 80, 255, 80, 80, 80, 255]);
});

test('rejects noisy name and overlong residence rather than inventing data', () => {
  assert.deepEqual(parseText('Họ và tên / Full name\n1 xx\nNguyễn Văn An\nNơi thường trú / Place\nSố 1, Phố A\nPhường B\nQuận C\nnoise\nmore noise\nNgày sinh: 01/02/1990'), {name:'Nguyễn Văn An',birth:'01/02/1990'});
});

test('color OCR recovers a name near its label and a dated back heading', async () => {
  const { parseColorPass, combineOcr } = await import('../lib/citizen-id/data.ts');
  const result = parseColorPass('Họ và tên / Full name\n: NGUYỄN VĂN AN\nNgày sinh', 'Date, month, year: 01/02/2020');
  assert.deepEqual(result, {name:'NGUYỄN VĂN AN', issue:'01/02/2020'});
  assert.deepEqual(combineOcr({name:'NGUYEN VAN AN'}, result), {name:'NGUYEN VAN AN', issue:'01/02/2020'});
  assert.deepEqual(combineOcr({name:'NGUYỄN VĂN AN'}, {name:'NGUYEN VAN AN'}), {name:'NGUYỄN VĂN AN'});
  assert.deepEqual(parseColorPass('Full name\nNGUYỄN VĂN AN\nTRẦN THỊ BÌNH', 'Date month year 01/02/2020\nDate month year 02/03/2021'), {});
  assert.deepEqual(parseColorPass('', 'Expiry date month year: 01/02/2020'), {});
  assert.deepEqual(parseColorPass('', 'Date month year: 01/02/2020 / 02/03/2021'), {});
  assert.deepEqual(parseColorPass('', 'Date month year\nExpiry date: 01/02/2020'), {});
});

test('diacritic suggestions preserve the two OCR variants without inventing a name', async () => {
  const { nameSuggestions } = await import('../lib/citizen-id/data.ts');
  assert.deepEqual(nameSuggestions('NGUYEN VAN AN', 'NGUYỄN VĂN AN'), ['NGUYEN VAN AN', 'NGUYỄN VĂN AN']);
  assert.deepEqual(nameSuggestions('NGUYE\u0302\u0303N VĂN AN', 'NGUYỄN VĂN AN'), []);
  assert.deepEqual(nameSuggestions('NGUYỄN VĂN AN', 'TRẦN THỊ BÌNH'), []);
  assert.deepEqual(nameSuggestions('NGUYỄN VĂN AN', undefined), []);
});


test('reads an adjacent sex value after a stray OCR glyph without guessing other values', () => {
  assert.deepEqual(parseText('Giới tinh: Ñ\nNữ'), {sex:'Nữ'});
  assert.deepEqual(parseText('Giới tính: Unknown\nNữ'), {});
  assert.deepEqual(parseText('Giới tính: X\nNữ'), {});
  assert.deepEqual(parseText('Giới tính: Nam'), {sex:'Nam'});
  assert.deepEqual(parseText('Giới tinh: Ñ\nNgày cấp: 01/02/2020'), {issue:'01/02/2020'});
});

test('merges only corroborated IDs and preserves leading zeros', async () => {
  const { parseColorPass, combineOcr } = await import('../lib/citizen-id/data.ts');
  const id = '001234567890', other = '009876543210';
  const colorText = `Số: ${id}`;
  const color = parseColorPass(colorText, '');
  assert.equal(combineOcr({}, color, `unlabelled ${id}`, colorText).number, id);
  assert.equal(combineOcr({}, color, '', colorText).number, undefined);
  assert.equal(combineOcr({}, color, `${id}\n${other}`, colorText).number, undefined);
  assert.equal(combineOcr({number: other}, color, other, colorText).number, undefined);
  assert.equal(combineOcr({number: id}, {}, id, `${id}\n${other}`).number, undefined);
  assert.equal(combineOcr({number: id}, {}, id, `noise ${other}`).number, undefined);
  assert.equal(parseColorPass('Số: 00123456789', '').number, undefined);
});

test('parses multiline residence and authority without merging conflicting readings', () => {
  assert.deepEqual(parseText('Nơi thường trú\nSố 1 Phố A\nPhường B\nNgày cấp: 01/02/2020\nCỤC CẢNH SÁT QUẢN LÝ\nHÀNH CHÍNH VỀ TRẬT TỰ XÃ HỘI'), {
    residence: 'Số 1 Phố A, Phường B', issue: '01/02/2020', authority: 'CỤC CẢNH SÁT QUẢN LÝ, HÀNH CHÍNH VỀ TRẬT TỰ XÃ HỘI'
  });
  assert.equal(parseText('Nơi thường trú: Phố A\nNgày cấp: 01/02/2020\nNơi thường trú: Phố B').residence, undefined);
});
