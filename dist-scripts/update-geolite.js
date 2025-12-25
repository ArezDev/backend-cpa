"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const tar = __importStar(require("tar"));
dotenv_1.default.config({ path: ".env" });
const LICENSE_KEY = process.env.MAXMIND_LICENSE_KEY;
if (!LICENSE_KEY) {
    console.error("❌ MAXMIND_LICENSE_KEY tidak ditemukan di .env.local");
    process.exit(1);
}
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
async function downloadAndExtract(edition) {
    const url = `https://download.maxmind.com/app/geoip_download?edition_id=${edition}&license_key=${LICENSE_KEY}&suffix=tar.gz`;
    const dest = path.join(DATA_DIR, `${edition}.tar.gz`);
    console.log(`⬇️ Downloading ${edition}...`);
    const res = await (0, node_fetch_1.default)(url);
    if (!res.ok)
        throw new Error(`Failed to download ${edition}: ${res.statusText}`);
    // simpan tar.gz ke disk
    const fileStream = fs.createWriteStream(dest);
    await new Promise((resolve, reject) => {
        var _a;
        res.body.pipe(fileStream);
        (_a = res.body) === null || _a === void 0 ? void 0 : _a.on("error", reject);
        fileStream.on("finish", () => resolve());
    });
    console.log(`📦 Extracting ${edition}...`);
    await new Promise((resolve, reject) => {
        tar
            .x({
            file: dest,
            cwd: DATA_DIR,
            strip: 1,
            filter: (p) => p.endsWith(".mmdb"),
        })
            .then(() => resolve())
            .catch((err) => reject(err));
    });
    fs.unlinkSync(dest);
    console.log(`✅ ${edition} siap di ${DATA_DIR}`);
}
(async () => {
    try {
        await downloadAndExtract("GeoLite2-City");
        await downloadAndExtract("GeoLite2-ASN");
    }
    catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
})();
