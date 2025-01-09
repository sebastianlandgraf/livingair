const b64s =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

export function b64t2d(input: string): string {
  let output = '';
  let chr1, chr2, chr3;
  let enc1, enc2, enc3, enc4;
  let i = 0;

  // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
  input = input.replace(/[^A-Za-z0-9+/=]/g, '');

  do {
    enc1 = b64s.indexOf(input.charAt(i++));
    enc2 = b64s.indexOf(input.charAt(i++));
    enc3 = b64s.indexOf(input.charAt(i++));
    enc4 = b64s.indexOf(input.charAt(i++));

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    output = output + String.fromCharCode(chr1);
    if (enc3 != 64) {
      output = output + String.fromCharCode(chr2);
    }
    if (enc4 != 64) {
      output = output + String.fromCharCode(chr3);
    }
  } while (i < input.length);

  return output;
}

export function encode_base64(d: any): string {
  const r: any[] = [];
  let i = 0;

  while (i < d.length) {
    r[r.length] = b64s.charAt(d[i] >> 2);
    r[r.length] = b64s.charAt(((d[i] & 3) << 4) | (d[i + 1] >> 4));
    r[r.length] = b64s.charAt(((d[i + 1] & 15) << 2) | (d[i + 2] >> 6));
    r[r.length] = b64s.charAt(d[i + 2] & 63);

    if (i % 57 == 54) r[r.length] = '\n';
    i += 3;
  }
  // Array in text zusammenf�hren
  return r.join('');
}
