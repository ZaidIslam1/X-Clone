import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useState } from "react";
const useFollow = () => {
    const queryClient = useQueryClient();
    const { mutate: followUnfollow, isPending } = useMutation({
        mutationFn: async (userId) => {
            try {
                const res = await fetch(`/api/users/follow/${userId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                });
                const data = await res.json();
                if (data.error) return null;
                if (!res.ok) throw new Error(data.error);
                return data;
            } catch (error) {
                throw new Error(error.message);
            }
        },

        onSuccess: (data) => {
            Promise.all([
                queryClient.invalidateQueries({ queryKey: ["suggested"] }),
                queryClient.invalidateQueries({ queryKey: ["authUser"] }),
                queryClient.invalidateQueries({ queryKey: ["userProfile"] }),
                queryClient.invalidateQueries({ queryKey: ["posts"] }),
            ]);
        },
        onError: () => {
            toast.error(error.message);
        },
    });

    return { followUnfollow, isPending };
};

export default useFollow;
