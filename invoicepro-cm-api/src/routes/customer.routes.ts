import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest, requireAuth } from "../middleware/auth";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "../validation/customer.schema";

const router = Router();

router.use(requireAuth);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const search = req.query.search?.toString();

    const customers = await prisma.customer.findMany({
      where: {
        userId,
        ...(search
          ? {
              name: {
                contains: search,
                },
            }
          : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({ customers });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;

    const parsed = createCustomerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const customer = await prisma.customer.create({
      data: {
        userId,
        ...parsed.data,
      },
    });

    return res.status(201).json({
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const customerId = req.params.id;

    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId,
      },
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    return res.json({ customer });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const customerId = req.params.id;

    const parsed = updateCustomerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId,
      },
    });

    if (!existingCustomer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: parsed.data,
    });

    return res.json({
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const customerId = req.params.id;

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId,
      },
    });

    if (!existingCustomer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const invoiceCount = await prisma.invoice.count({
      where: { customerId },
    });

    if (invoiceCount > 0) {
      return res.status(400).json({
        message: "Cannot delete customer because they already have invoices",
      });
    }

    await prisma.customer.delete({
      where: { id: customerId },
    });

    return res.json({
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/:id/invoices", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const customerId = req.params.id;

    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId,
      },
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        customerId,
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({ invoices });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default router;
