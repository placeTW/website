import { authGetSession, SUPABASE_FUNCTIONS_URL } from ".";

export const functionsGetSessionInfo = async () => {
  const { data: sessionData, error: sessionError } = await authGetSession();
  if (sessionError || !sessionData?.session?.user) {
    throw new Error('Error fetching session' + sessionError?.message);
  }

  return [sessionData.session.user.id, sessionData.session.access_token];
}

export const functionsUpdateNickname = async (handle: string) => {
  const [userId, access_token] = await functionsGetSessionInfo();

  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/update-nickname`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`,
    },
    body: JSON.stringify({ userId, handle }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error);
  }

  return response.json();
}

export const functionsFetchOneUser = async () => {
  const [userId, access_token] = await functionsGetSessionInfo();

  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/fetch-one-user?user_id=${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error);
  }

  return response.json();
}

export const functionsGetRankName = async () => {
  const [, access_token] = await functionsGetSessionInfo();

  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/get-rank-name`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error);
  }

  return response.json();
}

export const functionsFetchUsers = async () => {
  const [, access_token] = await functionsGetSessionInfo();

  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/fetch-users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error);
  }

  return response.json();
}

export const functionsFetchCanModerate = async (rank_id: string) => {
  const [, access_token] = await functionsGetSessionInfo();

  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/fetch-can-moderate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`,
    },
    body: JSON.stringify({ rank_id }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    const errorString: string = errorData.error.toString();
    throw new Error(errorString);
  }

  return response.json();
}

export const functionsUpdateUserStatus = async (userId: string, rank: string) => {
  const [, access_token] = await functionsGetSessionInfo();

  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/updateUserStatus`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`,
    },
    body: JSON.stringify({ userId, rank }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    const errorString: string = errorData.error.toString();
    throw new Error(errorString);
  }

  return response.json();
}