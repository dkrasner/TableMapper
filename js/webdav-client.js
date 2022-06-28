import { AuthType, createClient } from "webdav/web";

const client = createClient("http://localhost:8081/webdav", {
    authType: AuthType.Digest,
    username: "admin",
    password: "admin"
});

window.DAVClient = client;
