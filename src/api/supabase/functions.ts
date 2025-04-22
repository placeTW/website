import { authGetSession, SUPABASE_FUNCTIONS_URL } from ".";
import { logSupabaseFetch } from "./logging";

export const functionsGetSessionInfo = async () => {
  const { data: sessionData, error: sessionError } = await authGetSession();

  if (sessionError || !sessionData?.session?.user) {
    return [null, null]; // Return null values to indicate no session
  }

  return [sessionData.session.user.id, sessionData.session.access_token];
};

export const functionsUpdateNickname = async (handle: string) => {
  const [userId, access_token] = await functionsGetSessionInfo();

  if (!userId || !access_token) {
    return; // Handle the lack of a session appropriately
  }

  const promise = fetch(`${SUPABASE_FUNCTIONS_URL}/update-nickname`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({ userId, handle }),
  });

  const response = logSupabaseFetch(await promise, "update-nickname");

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error);
  }

  return response.json();
};

export const functionsFetchOneUser = async () => {
  const [userId, access_token] = await functionsGetSessionInfo();

  if (!userId || !access_token) {
    return; // Handle the lack of a session appropriately
  }

  const promise = fetch(
    `${SUPABASE_FUNCTIONS_URL}/fetch-one-user?user_id=${userId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
    },
  );

  const response = logSupabaseFetch(await promise, "fetch-one-user");

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error);
  }

  return response.json();
};

export const functionsGetRankName = async () => {
  const [, access_token] = await functionsGetSessionInfo();

  if (!access_token) {
    return; // Handle the lack of a session appropriately
  }

  const promise = fetch(`${SUPABASE_FUNCTIONS_URL}/get-rank-name`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
  });

  const response = logSupabaseFetch(await promise, "get-rank-name");

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error);
  }

  return response.json();
};

export const functionsFetchUsers = async () => {
  const [, access_token] = await functionsGetSessionInfo();

  if (!access_token) {
    return; // Handle the lack of a session appropriately
  }

  const promise = fetch(`${SUPABASE_FUNCTIONS_URL}/fetch-users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
  });

  const response = logSupabaseFetch(await promise, "fetch-users");

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error);
  }

  return response.json();
};

export const functionsFetchCanModerate = async (rank_id: string) => {
  const [, access_token] = await functionsGetSessionInfo();

  if (!access_token) {
    return; // Handle the lack of a session appropriately
  }

  const promise = fetch(`${SUPABASE_FUNCTIONS_URL}/fetch-can-moderate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({ rank_id }),
  });

  const response = logSupabaseFetch(await promise, "fetch-can-moderate");

  if (!response.ok) {
    const errorData = await response.json();
    const errorString: string = errorData.error.toString();
    throw new Error(errorString);
  }

  return response.json();
};

export const functionsUpdateUserStatus = async (
  userId: string,
  rank: string,
) => {
  const [, access_token] = await functionsGetSessionInfo();

  if (!access_token) {
    return; // Handle the lack of a session appropriately
  }

  const promise = fetch(`${SUPABASE_FUNCTIONS_URL}/updateUserStatus`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({ userId, rank }),
  });

  const response = logSupabaseFetch(await promise, "updateUserStatus");

  if (!response.ok) {
    const errorData = await response.json();
    const errorString: string = errorData.error.toString();
    throw new Error(errorString);
  }

  return response.json();
};

export const insertNewUser = async (
  user_id: string,
  email: string,
  handle: string,
) => {
  const [, access_token] = await functionsGetSessionInfo();

  if (!access_token) {
    return; // Handle the lack of a session appropriately
  }

  const promise = fetch(`${SUPABASE_FUNCTIONS_URL}/insert-new-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({ user_id, email, handle }),
  });

  const response = logSupabaseFetch(await promise, "insert-new-user");

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Error inserting new user", errorData);
    throw new Error(errorData.error);
  }

  const data = await response.json();

  return data;
};
