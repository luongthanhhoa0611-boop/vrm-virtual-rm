/**
 * Netlify Function: bộ CHUYỂN TIẾP (proxy) giọng đọc tiếng Việt.
 * ------------------------------------------------------------------
 * Bản này KHÔNG cần API key, KHÔNG tốn phí — nó chỉ tải hộ file MP3 từ
 * nguồn giọng đọc công khai rồi trả về cho trình duyệt.
 *
 * Vì sao phải chuyển tiếp thay vì để trình duyệt gọi thẳng?
 *   Khi trang web gọi thẳng api.streamelements.com / translate.google.com
 *   bằng thẻ <audio src="...">, request đó thường bị chặn: CORS, Google
 *   kiểm tra Referer, AdBlock, hoặc firewall mạng công ty. Kết quả là
 *   <audio> báo lỗi và không ra tiếng.
 *   Khi đi qua hàm này, trình duyệt chỉ gọi tới CHÍNH domain của mình
 *   (/tts) và nhận về một file MP3 bình thường — không thể bị chặn.
 *
 * Endpoint (khớp y hệt server local vrm_server.py):
 *   GET /tts?voice=hoaimy|namminh|google&text=...   -> audio/mpeg
 *   GET /tts?probe=1                                -> 200 "ok"
 *
 * ⚠️ Đây vẫn là nguồn giọng miễn phí không có SLA, phù hợp demo/hackathon.
 *    Lên sản phẩm thật cần thay bằng FPT.AI / Zalo AI / Viettel AI.
 */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const seUrl = (voiceId, t) =>
  'https://api.streamelements.com/kappa/v2/speech?voice=' + voiceId +
  '&text=' + encodeURIComponent(t);

const ggUrl = (t) =>
  'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&ttsspeed=1&q=' +
  encodeURIComponent(t);

// Mỗi giọng có danh sách nguồn theo thứ tự ưu tiên; nguồn đầu chết thì thử
// nguồn sau, nhưng KHÔNG bao giờ đổi sang giọng khác giới tính.
const SOURCES = {
  hoaimy:  [(t) => seUrl('vi-VN-HoaiMyNeural', t), (t) => ggUrl(t)],
  namminh: [(t) => seUrl('vi-VN-NamMinhNeural', t)],
  google:  [(t) => ggUrl(t), (t) => seUrl('vi-VN-HoaiMyNeural', t)],
};

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

async function fetchAudio(url) {
  const resp = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Referer: 'https://translate.google.com/',
      Accept: 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8',
    },
  });
  if (!resp.ok) throw new Error('HTTP ' + resp.status);
  const buf = Buffer.from(await resp.arrayBuffer());
  if (buf.length < 500) throw new Error('phản hồi rỗng hoặc quá ngắn (' + buf.length + ' byte)');
  return buf;
}

exports.handler = async function (event) {
  const q = event.queryStringParameters || {};

  if (q.probe) {
    return { statusCode: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: 'ok' };
  }

  let text = (q.text || '').toString().trim();
  let voice = (q.voice || 'hoaimy').toString().toLowerCase();
  if (!SOURCES[voice]) voice = 'hoaimy';
  if (!text) {
    return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Thiếu tham số "text".' }) };
  }
  if (text.length > 500) text = text.slice(0, 500);

  const errors = [];
  const makers = SOURCES[voice];
  for (let i = 0; i < makers.length; i++) {
    const url = makers[i](text);
    try {
      const buf = await fetchAudio(url);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'no-store',
          'X-VRM-Source': voice + '#' + i,
        },
        body: buf.toString('base64'),
        isBase64Encoded: true,
      };
    } catch (err) {
      errors.push(url.split('?')[0] + ' -> ' + err.message);
    }
  }

  return {
    statusCode: 502,
    headers: JSON_HEADERS,
    body: JSON.stringify({ error: 'Không nguồn giọng đọc trực tuyến nào phản hồi.', detail: errors }),
  };
};
