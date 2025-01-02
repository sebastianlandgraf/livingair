//Generate a Base64 alphabet for the encoder. Using an array or object to
//store the alphabet the en-/decoder runs faster than with the commonly
//used string. At least with the browsers of 2009. ;-)
const b64Enc = (function () {
    const ret = [];
    const str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    for (let i = 0; i < str.length; i++) {
        ret[i] = str.charAt(i);
    }
    return ret;
})();
//Generate a Base64 alphabet for the decoder.
const b64Dec = (function () {
    const ret = new Map();
    const str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    for (let i = 0; i < str.length; i++) {
        ret.set(str.charAt(i), i);
    }
    return ret;
})();
/**
 * Base64 encoder
 *
 * @param {Array} data
 */
export function encodeBase64(data) {
    const $ = b64Enc;
    let i = 0, out = '', c1, c2, c3;
    while (i < data.length) {
        c1 = data[i++];
        c2 = data[i++];
        c3 = data[i++];
        out =
            out +
                $[c1 >> 2] +
                $[((c1 & 3) << 4) | (c2 >> 4)] +
                (isNaN(c2) ? '=' : $[((c2 & 15) << 2) | (c3 >> 6)]) +
                (isNaN(c2) || isNaN(c3) ? '=' : $[c3 & 63]);
    }
    return out;
}
//======================================================================================
//                                  Decoder Functions
//======================================================================================
/**
 * Base64 decoder
 *
 * @param {String} data
 */
export function decodeBase64(data) {
    const $ = b64Dec;
    let i = 0, output = '', c1, c2, c3, e1, e2, e3, e4;
    //Cut all characters but A-Z, a-z, 0-9, +, /, or =
    data = data.replace(/[^A-Za-z0-9\+\/\=]/g, '');
    do {
        e1 = $.get(data.charAt(i++)) ?? 0;
        e2 = $.get(data.charAt(i++)) ?? 0;
        e3 = $.get(data.charAt(i++)) ?? 0;
        e4 = $.get(data.charAt(i++)) ?? 0;
        c1 = (e1 << 2) | (e2 >> 4);
        c2 = ((e2 & 15) << 4) | (e3 >> 2);
        c3 = ((e3 & 3) << 6) | e4;
        output += String.fromCharCode(c1);
        if (e3 !== 64) {
            output += String.fromCharCode(c2);
        }
        if (e4 !== 64) {
            output += String.fromCharCode(c3);
        }
    } while (i < data.length);
    return output;
}
