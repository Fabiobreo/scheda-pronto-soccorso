import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box component="section" sx={{ mb: 3, breakInside: "avoid" }}>
      <Typography
        variant="h2"
        sx={{
          mb: 1.5,
          pb: 0.5,
          borderBottom: 1,
          borderColor: "divider",
          color: "primary.main",
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}
