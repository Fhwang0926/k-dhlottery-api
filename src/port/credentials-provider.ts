import * as fs from "fs";
import * as path from "path";
import * as TOML from "@iarna/toml";
import readlineSync from "readline-sync";
import { User } from "../domain/user";

function getCredentialsPath(customPath?: string): string {
  if (customPath) return path.resolve(customPath);
  const home = process.env.HOME || process.env.USERPROFILE || process.env.USERPROFILE;
  return path.join(home || "~", ".dhapi", "credentials");
}

function readCredentialsFile(
  filePath: string
): Record<string, { username: string; password: string }> {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf-8").trim();
  if (!content) return {};
  return TOML.parse(content) as Record<string, { username: string; password: string }>;
}

export class CredentialsProvider {
  private readonly credentialsPath: string;
  private readonly credentials: { username: string; password: string };

  constructor(profileName: string, credentialsPath?: string) {
    this.credentialsPath = getCredentialsPath(credentialsPath);
    this.credentials = this.getCredentials(profileName);
  }

  private ensureCredentialsFile(): void {
    const dir = path.dirname(this.credentialsPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.credentialsPath)) {
      fs.writeFileSync(this.credentialsPath, "", "utf-8");
    }
  }

  private get(key: "username" | "password"): string {
    if (key in this.credentials) return this.credentials[key];
    throw new Error(`프로필 정보에서 ${key} 속성을 찾지 못했습니다.`);
  }

  getUser(): User {
    return new User(this.get("username"), this.get("password"));
  }

  private getCredentials(profileName: string): { username: string; password: string } {
    if (!fs.existsSync(this.credentialsPath)) {
      const answer = readlineSync.question(
        `❌ ${this.credentialsPath} 파일을 찾을 수 없습니다. 파일을 생성하고 프로필을 추가하시겠습니까? [Y/n] `
      ).trim().toLowerCase();
      if (["y", "yes", ""].includes(answer)) {
        let name = profileName;
        const useDefault = readlineSync.question(
          `📝 입력된 프로필 이름을 사용하시겠습니까? (${profileName}) [Y/n] `
        ).trim().toLowerCase();
        if (!["y", "yes", ""].includes(useDefault)) {
          name = readlineSync.question("📝 프로필 이름을 입력하세요: ").trim();
        }
        this.addCredentials(name);
        return this.readProfile(name)!;
      }
      throw new Error(`${this.credentialsPath} 파일을 찾을 수 없습니다.`);
    }

    let credentials = this.readProfile(profileName);
    if (!credentials) {
      const answer = readlineSync.question(
        `❌'${profileName}' 프로필을 찾지 못했습니다. 추가하시겠습니까? [Y/n] `
      ).trim().toLowerCase();
      if (["y", "yes", ""].includes(answer)) {
        this.addCredentials(profileName);
        credentials = this.readProfile(profileName);
      }
      if (!credentials) {
        throw new Error(
          `${this.credentialsPath} 파일에서 '${profileName}' 프로필을 찾지 못했습니다.`
        );
      }
    }
    return credentials;
  }

  private readProfile(profileName: string): { username: string; password: string } | null {
    const config = readCredentialsFile(this.credentialsPath);
    return config[profileName] ?? null;
  }

  private addCredentials(profileName: string): void {
    this.ensureCredentialsFile();
    const userId = readlineSync.question("📝 사용자 ID를 입력하세요: ").trim();
    const userPw = readlineSync.question("📝 사용자 비밀번호를 입력하세요: ", {
      hideEchoBack: true,
    });
    let config: Record<string, any> = {};
    if (fs.existsSync(this.credentialsPath)) {
      const content = fs.readFileSync(this.credentialsPath, "utf-8").trim();
      if (content) config = TOML.parse(content) as Record<string, any>;
    }
    config[profileName] = { username: userId, password: userPw };
    fs.writeFileSync(this.credentialsPath, TOML.stringify(config), "utf-8");
  }

  static listProfiles(credentialsPath?: string): string[] {
    const p = getCredentialsPath(credentialsPath);
    if (!fs.existsSync(p)) {
      throw new Error(`${p} 파일을 찾을 수 없습니다.`);
    }
    const config = readCredentialsFile(p);
    return Object.keys(config);
  }
}
