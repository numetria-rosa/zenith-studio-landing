// @signalwire/compatibility-api ships real types (compatibility-api.d.ts)
// but its package.json "exports" map has no "types" condition, so under
// this project's module resolution TypeScript can't find them at all — a
// packaging bug in the library, not something to work around by loosening
// our own tsconfig. Minimal ambient shape for exactly what this codebase
// uses (see src/lib/signalwire-text-back.ts); extend if more of the SDK is
// used later.
declare module "@signalwire/compatibility-api" {
  export interface AvailablePhoneNumber {
    phoneNumber: string;
  }

  export interface IncomingPhoneNumber {
    sid: string;
    phoneNumber: string;
  }

  export interface Message {
    sid: string;
  }

  export interface RestClientInstance {
    availablePhoneNumbers(countryCode: string): {
      local: {
        list(opts: { areaCode?: number; limit?: number }): Promise<AvailablePhoneNumber[]>;
      };
    };
    incomingPhoneNumbers: {
      create(opts: {
        phoneNumber: string;
        voiceUrl?: string;
        voiceMethod?: string;
        smsUrl?: string;
        smsMethod?: string;
      }): Promise<IncomingPhoneNumber>;
    };
    messages: {
      create(opts: { to: string; from: string; body: string }): Promise<Message>;
    };
  }

  export interface RestClientStatic {
    (projectId: string, apiToken: string, opts: { signalwireSpaceUrl: string }): RestClientInstance;
    validateRequest(
      signingKey: string,
      signatureHeader: string,
      url: string,
      params: Record<string, string>
    ): boolean;
  }

  export const RestClient: RestClientStatic;
}
