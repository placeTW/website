import { supabase } from "./index";
import { authGetSession } from "./auth";
import { SUPABASE_FUNCTIONS_URL } from './index';

// Layers-related functions
export const createLayer = async (layerName: string, userId: string) => {
  const { data, error } = await supabase
    .from("art_tool_layers")
    .insert([
      { layer_name: layerName, created_by_user_id: userId, likes_count: 0 }
    ]);

  if (error) {
    console.error("Error creating layer:", error);
    throw new Error(error.message);
  }

  return data;
};

export const fetchLayersWithUserDetails = async () => {
  const { data, error } = await supabase
    .from('art_tool_layers')
    .select(`
      id,
      created_at,
      layer_name,
      layer_thumbnail,
      likes_count,
      created_by_user_id,
      art_tool_users:art_tool_users (
        handle,
        rank
      )
    `);

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

// Other PostgreSQL-related functions from functions.ts
export const functionsGetSessionInfo = async () => {
  const { data: sessionData, error: sessionError } = await authGetSession();
  if (sessionError || !sessionData?.session?.user) {
    throw new Error("Error fetching session: " + sessionError?.message);
  }

  return [sessionData.session.user.id, sessionData.session.access_token];
};

export const functionsUpdateNickname = async (handle: string) => {
  const [userId, access_token] = await functionsGetSessionInfo();

  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/update-nickname`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({ userId, handle }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error);
  }

  return response.json();
};

export const functionsFetchOneUser = async () => {
  const [userId, access_token] = await functionsGetSessionInfo();

  console.log("Fetching one user with userId", userId);

  const response = await fetch(
    `${SUPABASE_FUNCTIONS_URL}/fetch-one-user?user_id=${userId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error);
  }

  return response.json();
};

export const functionsGetRankName = async () => {
  const [, access_token] = await functionsGetSessionInfo();

  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/get-rank-name`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error);
  }

  return response.json();
};

export const functionsFetchUsers = async () => {
  const [, access_token] = await functionsGetSessionInfo();

  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/fetch-users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error);
  }

  return response.json();
};

export const functionsFetchCanModerate = async (rank_id: string) => {
  const [, access_token] = await functionsGetSessionInfo();

  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/fetch-can-moderate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({ rank_id }),
  });

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

  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/updateUserStatus`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({ userId, rank }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    const errorString: string = errorData.error.toString();
    throw new Error(errorString);
  }

  return response.json();
};

export const insertNewUser = async (user_id: string, email: string, handle: string) => {
  const [, access_token] = await functionsGetSessionInfo();
  console.log("Inserting new user with", { user_id, email, handle });

  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/insert-new-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({ user_id, email, handle }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Error inserting new user", errorData);
    throw new Error(errorData.error);
  }

  const data = await response.json();
  console.log("User inserted successfully", data);

  return data;
};
