import { Amplify } from "aws-amplify";

let configured = false;

export function configureAmplify() {
  if (configured) return;
  Amplify.configure(
    {
      Auth: {
        Cognito: {
          userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "",
          userPoolClientId:
            process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID ?? "",
        },
      },
      API: {
        GraphQL: {
          endpoint: process.env.NEXT_PUBLIC_APPSYNC_URL ?? "",
          region: process.env.NEXT_PUBLIC_APPSYNC_REGION ?? "us-east-1",
          defaultAuthMode: "userPool",
        },
      },
    },
    { ssr: true },
  );
  configured = true;
}
