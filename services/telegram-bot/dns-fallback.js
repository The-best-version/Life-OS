/* --- DNS fallback for Telegram API --------------------------------------
 *  Some local ISPs and Wi-Fi networks fail to resolve `api.telegram.org`
 *  (returning ENOTFOUND or EAI_AGAIN). When that happens, this resolver
 *  transparently falls back to public DNS (Google 8.8.8.8 / Cloudflare 1.1.1.1)
 *  and verified Telegram data center IPs, keeping the bot 100% online.
 * --------------------------------------------------------------------- */
import dns from "node:dns";

const TELEGRAM_HOSTS = new Set(["api.telegram.org", "telegram.org"]);
const TELEGRAM_IP = "149.154.166.110";

const resolver = new dns.promises.Resolver();
try {
  resolver.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

const origLookup = dns.lookup;

dns.lookup = function (hostname, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }

  origLookup.call(dns, hostname, options, (err, address, family) => {
    if (err && (err.code === "ENOTFOUND" || err.code === "EAI_AGAIN") && TELEGRAM_HOSTS.has(hostname)) {
      resolver
        .resolve4(hostname)
        .then((addrs) => {
          if (addrs && addrs.length > 0) {
            if (options && options.all) {
              return process.nextTick(() => callback(null, addrs.map((a) => ({ address: a, family: 4 }))));
            }
            return process.nextTick(() => callback(null, addrs[0], 4));
          }
          if (options && options.all) {
            return process.nextTick(() => callback(null, [{ address: TELEGRAM_IP, family: 4 }]));
          }
          return process.nextTick(() => callback(null, TELEGRAM_IP, 4));
        })
        .catch(() => {
          if (options && options.all) {
            return process.nextTick(() => callback(null, [{ address: TELEGRAM_IP, family: 4 }]));
          }
          return process.nextTick(() => callback(null, TELEGRAM_IP, 4));
        });
      return;
    }
    callback(err, address, family);
  });
};
