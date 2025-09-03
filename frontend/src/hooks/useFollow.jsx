import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const useFollow = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (userId) => {
            try {
                const res = await fetch(`/api/users/follow/${userId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to follow/unfollow");
                return data;
            } catch (error) {
                throw new Error(error);
            }
        },
        onSuccess: async (data) => {
            // Safety: server might return data without a user object in some edge cases.
            const targetUsername = data?.user?.username;
            const currentUsername = queryClient.getQueryData(["authUser"])?.username;

            const promises = [
                queryClient.invalidateQueries({ queryKey: ["suggested"] }),
                queryClient.invalidateQueries({ queryKey: ["authUser"] }),
                queryClient.invalidateQueries({ queryKey: ["userProfile"] }), // Invalidate all userProfile queries
                queryClient.invalidateQueries({ queryKey: ["posts"] }),
                targetUsername
                    ? queryClient.invalidateQueries({ queryKey: ["followers", targetUsername] })
                    : null,
                targetUsername
                    ? queryClient.invalidateQueries({ queryKey: ["following", targetUsername] })
                    : null,
                currentUsername
                    ? queryClient.invalidateQueries({ queryKey: ["followers", currentUsername] })
                    : null,
                currentUsername
                    ? queryClient.invalidateQueries({ queryKey: ["following", currentUsername] })
                    : null,
            ].filter(Boolean); // remove nulls

            await Promise.all(promises);
        },

        onError: (error) => {
            toast.error(error.message || "Something went wrong");
        },
    });

    return {
        followUnfollow: mutation.mutate,
        isPending: mutation.isLoading,
    };
};

export default useFollow;
