import { comparePassword, hashPassword } from "../helpers/authHelper.js";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import JWT from "jsonwebtoken";

// post method register
export const registerController = async (req,res) => {
    try {
        const {name,email,password,phone,address,answer} = req.body;

        // validations
        if(!name){
            return res.send({
              message : "Name is required!"
            })
        }

        if (!email) {
          return res.send({
            message : "Email is required!",
          });
        }

        if (!password) {
          return res.send({
            message : "Password is required!",
          });
        }

        if (!phone) {
          return res.send({
            message : "Phone number is required!",
          });
        }

        if (!address) {
          return res.send({
            message : "Address is required!",
          });
        }

        if (!answer) {
          return res.send({
            message: "Answer is required!",
          });
        }

        //check for existing user
        const existinguser = await userModel.findOne({email});
        if(existinguser){
            return res.status(200).send({
                success : false,
                message : "Already register please login!",
            })
        }

        // if not existing user then register
        const hashedPassword = await hashPassword(password);
        //save user
        const user = await new userModel({
          name,
          email,
          phone,
          address,
          password: hashedPassword,
          answer,
        }).save();

        res.status(201).send({
            success : true,
            message : "User register successfully!",
            user
        })

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success : false,
            message : "Error in registration",
            error
        })
    }
};

// post method login
export const loginController = async (req,res) => {
    try {
        const {email,password} = req.body;

        // validation
        if(!email || !password){
            return res.status(404).send({
                success : false,
                message : "Invalid email or password!",
            })
        }

        //check if user exists based on email
        const user = await userModel.findOne({email});

        if(!user){
            return res.status(404).send({
                success : false,
                message : "Email is not registered!"
            })
        }

        //if user exists then check for password match
        const match = await comparePassword(password,user.password);

        // if passwrod doesn't match 
        if(!match){
            return res.status(200).sned({
                success : false,
                message : "Incorrect password!"
            })
        }

        // if password match then create token
        const token = await JWT.sign(
          { _id: user._id },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );

        res.status(200).send({
          success: true,
          message: "Login successfully!",
          user: {
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            role : user.role,
          },
          token,
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success : false,
            message : "Error in login!",
            error
        })
    }
};

// forgot password controller
export const forgotPasswordController = async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body;
    if (!email) {
      res.status(400).send({ message: "Emai is required" });
    }
    if (!answer) {
      res.status(400).send({ message: "answer is required" });
    }
    if (!newPassword) {
      res.status(400).send({ message: "New Password is required" });
    }
    //check
    const user = await userModel.findOne({ email, answer });
    //validation
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Wrong Email Or Answer",
      });
    }
    const hashed = await hashPassword(newPassword);
    await userModel.findByIdAndUpdate(user._id, { password: hashed });
    res.status(200).send({
      success: true,
      message: "Password Reset Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

// test controller
export const testController = (req,res)=>{
    res.send("Protected route!");
};

// update profile
export const updateProfileController = async (req,res)=>{
  try {
    const {name,email,password,address,phone} = req.body;

    const user = await userModel.findById(req.user._id);

    if(password && password.length < 6){
      return res.json({error:"Password is required and it should be of 6 charactes!"})
    }
    const hashedPassword = password ? await hashPassword(password) : undefined;

    const updatedUser = await userModel.findByIdAndUpdate(req.user._id,{
      name : name || user.name,
      password : hashedPassword || user.password,
      phone : phone || user.phone,
      address : address || user.address,
    },{new : true});

    res.status(200).send({
      success :true,
      message : "Profile updated successfully!",
      updatedUser
    })
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success : false,
      message : "Erro while updating profile!",
      error,
    })
  }
};

// get orders
export const getOrdersController = async (req,res)=>{
  try {
    const orders = await orderModel
      .find({ buyer: req.user._id })
      .populate("products", "-photo")
      .populate("buyer", "name");

    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting orders!",
      error,
    });
  }
};

// get all orders in admin panel
export const getAllOrdersController = async(req,res)=>{
  try {
    const orders = await orderModel
      .find({})
      .populate("products", "-photo")
      .populate("buyer", "name")
      .sort({createdAt : "-1"});

    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting orders!",
      error,
    });
  }
};

// update order status
export const orderStatusController = async(req,res)=>{
  try {
    const {orderId} = req.params;
    const {status} = req.body;

    const orders = await orderModel.findByIdAndUpdate(orderId,{status},{new:true});

    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success : false,
      message : "Error while updating the status of order!",
      error,
    })
  }
}
