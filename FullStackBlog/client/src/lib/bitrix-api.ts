export interface BitrixConfig {
  domain: string;
  token: string;
}

export interface BitrixEntity {
  ID: string;
  [key: string]: any;
}

export interface BitrixResponse<T = any> {
  result: T;
  total?: number;
  next?: number;
  time?: {
    start: number;
    finish: number;
    duration: number;
  };
}

export class BitrixAPI {
  private config: BitrixConfig;

  constructor(config: BitrixConfig) {
    this.config = config;
  }

  private getApiUrl(method: string): string {
    return `https://${this.config.domain}/rest/1/${this.config.token}/${method}`;
  }

  async call<T = any>(method: string, params: any = {}): Promise<BitrixResponse<T>> {
    const url = this.getApiUrl(method);
    
    const formData = new FormData();
    Object.keys(params).forEach(key => {
      if (typeof params[key] === 'object') {
        formData.append(key, JSON.stringify(params[key]));
      } else {
        formData.append(key, params[key]);
      }
    });

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Bitrix API error: ${data.error_description || data.error}`);
    }

    return data;
  }

  // Contact methods
  async getContacts(params: any = {}) {
    return this.call('crm.contact.list', params);
  }

  async updateContact(id: string, fields: any) {
    return this.call('crm.contact.update', { id, fields });
  }

  // Company methods
  async getCompanies(params: any = {}) {
    return this.call('crm.company.list', params);
  }

  async updateCompany(id: string, fields: any) {
    return this.call('crm.company.update', { id, fields });
  }

  // Batch operations
  async batch(commands: Record<string, string>) {
    return this.call('batch', { cmd: commands });
  }

  // Search methods
  async searchContact(filter: any, select: string[] = ['ID', '*']) {
    return this.call('crm.contact.list', { filter, select });
  }

  async searchCompany(filter: any, select: string[] = ['ID', '*']) {
    return this.call('crm.company.list', { filter, select });
  }
}

export function createBitrixAPI(domain: string, token: string): BitrixAPI {
  return new BitrixAPI({ domain, token });
}