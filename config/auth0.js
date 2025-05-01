import { Auth0Provider } from '@auth0/auth0-react';
import { useAuth0 } from '@auth0/auth0-react';

export const auth0Config = {
  domain: 'dev-euksl3e3ndmpypcn.us.auth0.com', // Replace with your Auth0 domain
  clientId: '0anEwRAyCg7Dj1u2RnyCaKH6TRpO1kSV', // Replace with your Auth0 client ID
  audience: 'https://dev-euksl3e3ndmpypcn.us.auth0.com/api/v2/', // Replace with your Auth0 API audience
  redirectUri: 'exp://192.168.1.43:8081' // Replace with your app's redirect URI
};

export const Auth0ProviderWithConfig = ({ children }) => {
  return (
    <Auth0Provider
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={{
        redirect_uri: auth0Config.redirectUri,
        audience: auth0Config.audience
      }}
    >
      {children}
    </Auth0Provider>
  );
};

export const useAuth0Hook = () => {
  const { loginWithRedirect, logout, user, isAuthenticated, isLoading } = useAuth0();

  return {
    login: loginWithRedirect,
    logout,
    user,
    isAuthenticated,
    isLoading
  };
};
