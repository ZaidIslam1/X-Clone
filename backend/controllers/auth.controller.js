
export const signup = async (req, res, next) => {
    try {
        res.json({
            data: "You hit the signup endpoint"
        })
    } catch (error) {
        console.log("Error in signup", error)
        next(error)
    }
}

export const login = async (req, res, next) => {
    try {
        res.json({
            data: "You hit the signup endpoint"
        })
    } catch (error) {
        console.log("Error in signup", error)
        next(error)
    }
}

export const logout = async (req, res, next) => {
    try {
        res.json({
            data: "You hit the signup endpoint"
        })
    } catch (error) {
        console.log("Error in signup", error)
        next(error)
    }
}
