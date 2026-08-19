/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Bộ giải mã X.509 certificate tối giản, không phụ thuộc thư viện ngoài.
 *
 * Vì sao không dùng thư viện như @peculiar/x509?
 * Thư viện đó cần thêm 1 polyfill Reflect ở entry point (reflect-metadata),
 * kéo theo rủi ro làm hỏng build mà không cách nào chạy thử trực tiếp
 * trên máy của bạn để kiểm tra. Cert ở đây (SSL trong APISIX) chỉ cần đọc
 * vài trường cố định để hiển thị, không cần build/verify cả chuỗi chứng
 * thực - nên tiếp tục tự đọc DER là lựa chọn an toàn hơn, ít phụ thuộc hơn.
 *
 * Cách đọc: đi đúng theo thứ tự trường của TBSCertificate trong RFC 5280
 * (version?, serialNumber, signature, issuer, validity, subject,
 * subjectPublicKeyInfo, ..., extensions?) thay vì dò tìm byte-pattern tự
 * do trong toàn bộ file - để không bị nhầm khi 1 OID/chuỗi vô tình xuất
 * hiện ở chỗ khác trong cert.
 *
 * Đã tự tạo cert RSA 2048-bit có SAN/O/C thật và đối chiếu kết quả hàm
 * này với `openssl x509 -text -noout` để xác nhận đúng trước khi dùng.
 */

type DerNode = {
  tag: number;
  /** vị trí byte tag bắt đầu - cần để cắt được TLV đầy đủ (tag+length+value), ví dụ khi băm SHA-256 */
  start: number;
  contentStart: number;
  contentEnd: number;
};

const parseDerLength = (
  bytes: Uint8Array,
  offset: number
): { length: number; nextOffset: number } => {
  const first = bytes[offset];
  if ((first & 0x80) === 0) {
    return { length: first, nextOffset: offset + 1 };
  }
  const numBytes = first & 0x7f;
  let length = 0;
  for (let i = 0; i < numBytes; i++) {
    length = (length << 8) | bytes[offset + 1 + i];
  }
  return { length, nextOffset: offset + 1 + numBytes };
};

const parseDerTLV = (bytes: Uint8Array, offset: number): DerNode => {
  const tag = bytes[offset];
  const { length, nextOffset } = parseDerLength(bytes, offset + 1);
  return { tag, start: offset, contentStart: nextOffset, contentEnd: nextOffset + length };
};

/** Duyệt các node con trực tiếp của 1 node constructed (SEQUENCE/SET/...). */
const childrenOf = (bytes: Uint8Array, node: DerNode): DerNode[] => {
  const children: DerNode[] = [];
  let pos = node.contentStart;
  while (pos < node.contentEnd) {
    const child = parseDerTLV(bytes, pos);
    children.push(child);
    pos = child.contentEnd;
  }
  return children;
};

const STRING_TAGS = new Set([0x0c, 0x13, 0x16, 0x14, 0x1e]);

const decodeDerString = (bytes: Uint8Array, node: DerNode): string => {
  const slice = bytes.slice(node.contentStart, node.contentEnd);
  // BMPString (0x1e) mã hoá UTF-16BE, còn lại xem như UTF-8/ASCII.
  return node.tag === 0x1e
    ? new TextDecoder('utf-16be').decode(slice)
    : new TextDecoder().decode(slice);
};

/** OID dạng byte -> chuỗi "1.2.840.113549.1.1.11" */
const decodeOid = (bytes: Uint8Array, node: DerNode): string => {
  const b = bytes.slice(node.contentStart, node.contentEnd);
  if (b.length === 0) return '';
  const parts: number[] = [Math.floor(b[0] / 40), b[0] % 40];
  let value = 0;
  for (let i = 1; i < b.length; i++) {
    value = (value << 7) | (b[i] & 0x7f);
    if ((b[i] & 0x80) === 0) {
      parts.push(value);
      value = 0;
    }
  }
  return parts.join('.');
};

const parseTimeValue = (bytes: Uint8Array, node: DerNode): Date | null => {
  const str = decodeDerString(bytes, node);
  if (node.tag === 0x17) {
    const m = str.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/);
    if (!m) return null;
    let year = parseInt(m[1], 10);
    year += year < 50 ? 2000 : 1900;
    return new Date(
      Date.UTC(
        year,
        parseInt(m[2], 10) - 1,
        parseInt(m[3], 10),
        parseInt(m[4], 10),
        parseInt(m[5], 10),
        parseInt(m[6], 10)
      )
    );
  }
  if (node.tag === 0x18) {
    const m = str.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/);
    if (!m) return null;
    return new Date(
      Date.UTC(
        parseInt(m[1], 10),
        parseInt(m[2], 10) - 1,
        parseInt(m[3], 10),
        parseInt(m[4], 10),
        parseInt(m[5], 10),
        parseInt(m[6], 10)
      )
    );
  }
  return null;
};

// --- OID quan tâm ---
const OID = {
  commonName: '2.5.4.3',
  organizationName: '2.5.4.10',
  countryName: '2.5.4.6',
  subjectAltName: '2.5.29.17',
  rsaEncryption: '1.2.840.113549.1.1.1',
  ecPublicKey: '1.2.840.10045.2.1',
} as const;

const SIG_ALG_NAMES: Record<string, string> = {
  '1.2.840.113549.1.1.5': 'SHA1-RSA',
  '1.2.840.113549.1.1.11': 'SHA256-RSA',
  '1.2.840.113549.1.1.12': 'SHA384-RSA',
  '1.2.840.113549.1.1.13': 'SHA512-RSA',
  '1.2.840.10045.4.3.2': 'ECDSA-SHA256',
  '1.2.840.10045.4.3.3': 'ECDSA-SHA384',
  '1.2.840.10045.4.3.4': 'ECDSA-SHA512',
  '1.2.840.10040.4.3': 'DSA-SHA1',
};

const CURVE_NAMES: Record<string, { name: string; bits: number }> = {
  '1.2.840.10045.3.1.7': { name: 'P-256', bits: 256 },
  '1.3.132.0.34': { name: 'P-384', bits: 384 },
  '1.3.132.0.35': { name: 'P-521', bits: 521 },
};

type DnInfo = { cn?: string; o?: string; c?: string };

const parseDN = (bytes: Uint8Array, dnNode: DerNode): DnInfo => {
  const result: DnInfo = {};
  // RDNSequence = SEQUENCE OF RelativeDistinguishedName (SET OF AttributeTypeAndValue)
  for (const rdn of childrenOf(bytes, dnNode)) {
    for (const atv of childrenOf(bytes, rdn)) {
      const [typeNode, valueNode] = childrenOf(bytes, atv);
      if (!typeNode || !valueNode) continue;
      const oid = decodeOid(bytes, typeNode);
      if (!STRING_TAGS.has(valueNode.tag)) continue;
      const str = decodeDerString(bytes, valueNode);
      if (oid === OID.commonName) result.cn = str;
      else if (oid === OID.organizationName) result.o = str;
      else if (oid === OID.countryName) result.c = str;
    }
  }
  return result;
};

const parseSans = (bytes: Uint8Array, extensionsNode: DerNode): string[] => {
  // extensions là [3] EXPLICIT SEQUENCE OF Extension
  const [extSeq] = childrenOf(bytes, extensionsNode);
  if (!extSeq) return [];
  for (const ext of childrenOf(bytes, extSeq)) {
    const extChildren = childrenOf(bytes, ext);
    const oidNode = extChildren[0];
    const octetNode = extChildren[extChildren.length - 1]; // extnValue luôn là phần tử cuối
    if (!oidNode || !octetNode) continue;
    if (decodeOid(bytes, oidNode) !== OID.subjectAltName) continue;

    // extnValue là OCTET STRING bọc thêm 1 lớp DER nữa (GeneralNames SEQUENCE)
    const inner = bytes.slice(octetNode.contentStart, octetNode.contentEnd);
    const generalNamesSeq = parseDerTLV(inner, 0);
    const sans: string[] = [];
    for (const gn of childrenOf(inner, generalNamesSeq)) {
      if (gn.tag === 0x82) {
        // [2] IMPLICIT IA5String = dNSName
        sans.push(new TextDecoder().decode(inner.slice(gn.contentStart, gn.contentEnd)));
      }
    }
    return sans;
  }
  return [];
};

type PublicKeyInfo = { algorithm: 'RSA' | 'EC' | 'Unknown'; bits: number | null };

const parsePublicKeyInfo = (bytes: Uint8Array, spkiNode: DerNode): PublicKeyInfo => {
  const [algIdNode, bitStringNode] = childrenOf(bytes, spkiNode);
  if (!algIdNode || !bitStringNode) return { algorithm: 'Unknown', bits: null };
  const algIdChildren = childrenOf(bytes, algIdNode);
  const keyAlgOid = algIdChildren[0] ? decodeOid(bytes, algIdChildren[0]) : '';

  if (keyAlgOid === OID.rsaEncryption) {
    // Nội dung BIT STRING: 1 byte "unused bits" (luôn 0x00 với khoá RSA) rồi tới
    // SEQUENCE { modulus INTEGER, publicExponent INTEGER } của RSAPublicKey.
    const bitContent = bytes.slice(bitStringNode.contentStart + 1, bitStringNode.contentEnd);
    const rsaSeq = parseDerTLV(bitContent, 0);
    const [modulusNode] = childrenOf(bitContent, rsaSeq);
    if (!modulusNode) return { algorithm: 'RSA', bits: null };
    let modBytes = bitContent.slice(modulusNode.contentStart, modulusNode.contentEnd);
    if (modBytes[0] === 0x00) modBytes = modBytes.slice(1); // byte đệm để INTEGER không âm
    return { algorithm: 'RSA', bits: modBytes.length * 8 };
  }

  if (keyAlgOid === OID.ecPublicKey) {
    const curveOidNode = algIdChildren[1];
    const curveOid = curveOidNode ? decodeOid(bytes, curveOidNode) : '';
    const curve = CURVE_NAMES[curveOid];
    return { algorithm: 'EC', bits: curve?.bits ?? null };
  }

  return { algorithm: 'Unknown', bits: null };
};

const bytesToDecimal = (bytes: Uint8Array): string => {
  let value = 0n;
  for (const b of bytes) value = (value << 8n) | BigInt(b);
  return value.toString();
};

const pemToBytes = (pem: string): Uint8Array => {
  const b64 = pem
    .replace(/-----BEGIN CERTIFICATE-----/, '')
    .replace(/-----END CERTIFICATE-----/, '')
    .replace(/\s+/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

export type CertInfo = {
  notBefore: Date;
  notAfter: Date;
  /** 1, 2, hoặc 3 (X.509 v1/v2/v3) */
  version: number;
  /** dạng thập phân, giống cách Traefik hiển thị Serial Number */
  serialNumberDecimal: string | null;
  issuer: DnInfo;
  subject: DnInfo;
  sans: string[];
  publicKey: PublicKeyInfo;
  /** vd "SHA256-RSA" - trả về OID gốc nếu không nhận diện được thuật toán */
  signatureAlgorithm: string;
};

export const parseCertInfo = (pem: string): CertInfo | null => {
  try {
    const bytes = pemToBytes(pem);
    const certificate = parseDerTLV(bytes, 0);
    const [tbsCertificate] = childrenOf(bytes, certificate);
    if (!tbsCertificate) return null;

    const tbsChildren = childrenOf(bytes, tbsCertificate);
    let i = 0;
    let version = 1; // mặc định v1 khi không có field [0] version (hiếm gặp với cert hiện đại)
    if (tbsChildren[i]?.tag === 0xa0) {
      const versionInnerNode = childrenOf(bytes, tbsChildren[i])[0];
      if (versionInnerNode) {
        const raw = bytes.slice(versionInnerNode.contentStart, versionInnerNode.contentEnd);
        version = (raw.length ? raw[raw.length - 1] : 0) + 1;
      }
      i++;
    }
    const serialNode = tbsChildren[i++];
    const sigAlgNode = tbsChildren[i++]; // AlgorithmIdentifier
    const issuerNode = tbsChildren[i++];
    const validityNode = tbsChildren[i++];
    const subjectNode = tbsChildren[i++];
    const spkiNode = tbsChildren[i++];
    let extensionsNode: DerNode | undefined;
    for (; i < tbsChildren.length; i++) {
      if (tbsChildren[i].tag === 0xa3) {
        extensionsNode = tbsChildren[i];
        break;
      }
    }

    if (!serialNode || !issuerNode || !validityNode || !subjectNode || !spkiNode) return null;

    const [notBeforeNode, notAfterNode] = childrenOf(bytes, validityNode);
    const notBefore = notBeforeNode ? parseTimeValue(bytes, notBeforeNode) : null;
    const notAfter = notAfterNode ? parseTimeValue(bytes, notAfterNode) : null;
    if (!notBefore || !notAfter) return null;

    const sigAlgOid = sigAlgNode
      ? decodeOid(bytes, childrenOf(bytes, sigAlgNode)[0] ?? sigAlgNode)
      : '';

    return {
      notBefore,
      notAfter,
      version,
      serialNumberDecimal: serialNode
        ? bytesToDecimal(bytes.slice(serialNode.contentStart, serialNode.contentEnd))
        : null,
      issuer: parseDN(bytes, issuerNode),
      subject: parseDN(bytes, subjectNode),
      sans: extensionsNode ? parseSans(bytes, extensionsNode) : [],
      publicKey: parsePublicKeyInfo(bytes, spkiNode),
      signatureAlgorithm: SIG_ALG_NAMES[sigAlgOid] ?? sigAlgOid,
    };
  } catch {
    return null;
  }
};

/**
 * SHA-256 fingerprint của toàn bộ certificate và của riêng public key -
 * giống 2 dòng "Certificate" / "Public Key" trong khối SHA-256 Fingerprints
 * của Traefik. Tách riêng khỏi parseCertInfo() vì Web Crypto digest() là
 * async, còn parseCertInfo() cần chạy đồng bộ trong useMemo() ở trang
 * danh sách (trang danh sách không cần fingerprint, chỉ trang chi tiết cần).
 */
export const computeCertFingerprints = async (
  pem: string
): Promise<{ certificate: string; publicKey: string } | null> => {
  try {
    const bytes = pemToBytes(pem);
    const certificate = parseDerTLV(bytes, 0);
    const [tbsCertificate] = childrenOf(bytes, certificate);
    if (!tbsCertificate) return null;
    const tbsChildren = childrenOf(bytes, tbsCertificate);
    let i = 0;
    if (tbsChildren[i]?.tag === 0xa0) i++;
    i += 4; // serial, sigAlg, issuer, validity
    const subjectNode = tbsChildren[i++];
    const spkiNode = tbsChildren[i];
    if (!subjectNode || !spkiNode) return null;

    const hex = async (data: Uint8Array) => {
      const digest = await crypto.subtle.digest('SHA-256', data as BufferSource);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    };

    // TLV đầy đủ (tag+length+value) của toàn bộ certificate và của riêng SubjectPublicKeyInfo
    const fullCertBytes = bytes.slice(certificate.start, certificate.contentEnd);
    const spkiBytes = bytes.slice(spkiNode.start, spkiNode.contentEnd);

    return {
      certificate: await hex(fullCertBytes),
      publicKey: await hex(spkiBytes),
    };
  } catch {
    return null;
  }
};
