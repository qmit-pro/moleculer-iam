import React from "react";
import { useAppState, useI18N, useWithLoading } from "../hook";
import { ScreenLayout } from "./component";
import { ActiveSessionList } from "./logout.end";

export const LogoutIndexScreen: React.FunctionComponent = () => {
  // states
  const { formatMessage: f } = useI18N();
  const { loading, withLoading, errors, setErrors } = useWithLoading();
  const [state, dispatch] = useAppState();

  const [handleSignOutAll, handleSignOutAllLoading] = withLoading(() => {
    return dispatch("logout.confirm")
      .then(() => setErrors({}))
      .catch((err: any) => setErrors(err));
  });
  const [handleRedirect, handleRedirectLoading] = withLoading(() => {
    return dispatch("logout.redirect")
      .then(() => setErrors({}))
      .catch((err: any) => setErrors(err));
  });

  // render
  return (
    <ScreenLayout
      title={`Sign out`}
      subtitle={state.user!.email}
      loading={loading}
      buttons={[
        {
          status: "primary",
          children: f({id: "button.done"}),
          onPress: handleRedirect,
          loading: handleRedirectLoading,
          tabIndex: 1,
        },
        {
          children: f({id: "logout.signOutAllSessions"}),
          onPress: handleSignOutAll,
          loading: handleSignOutAllLoading,
          tabIndex: 2,
        },
      ]}
      error={errors.global}
    >
      <ActiveSessionList authorizedClients={state.authorizedClients} />
    </ScreenLayout>
  );
};
