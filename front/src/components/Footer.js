import React from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Stack,
  Link,
  IconButton,
  Divider
} from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import InstagramIcon from "@mui/icons-material/Instagram";
import EmailIcon from "@mui/icons-material/Email";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        py: -2,
        color: "#fff",
        background: "linear-gradient(135deg,#5e2a9b 0%, #7b3fc4 45%, #9146d8 100%)",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.18)",
        position: "relative",
        zIndex: 10
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Brand / Intro */}
            <Grid item xs={12} md={4}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  letterSpacing: ".5px",
                  mb: 1,
                  textShadow: "0 2px 4px rgba(0,0,0,0.35)"
                }}
              >
                Form Builder
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.5 }}>
                Napravi ankete, forme i prikupljaj odgovore brzo. Stabilni ID‑evi pitanja,
                upload slika i analitika na jednom mestu.
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                <IconButton
                  size="small"
                  aria-label="GitHub"
                  href="https://github.com/NenadBolovic/Projekat-iz-informacionih-sistema-i-baza-podataka"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.15)",
                    color: "white",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }
                  }}
                >
                  <GitHubIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label="Instagram"
                  href="https://instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.15)",
                    color: "white",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }
                  }}
                >
                  <InstagramIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label="Email"
                  href="mailto:example@mail.com"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.15)",
                    color: "white",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }
                  }}
                >
                  <EmailIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Grid>

          

          {/* Resources */}
          <Grid item xs={6} sm={4} md={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Resursi
            </Typography>
            <Stack spacing={0.6}>
              <Link href="" underline="none" sx={linkStyle}>Privatnost</Link>
              <Link href="" underline="none" sx={linkStyle}>Uslovi</Link>
              <Link href="" underline="none" sx={linkStyle}>O projektu</Link>
              <Link href="" underline="none" sx={linkStyle}>Pomoć</Link>
            </Stack>
          </Grid>

          {/* Contact / Extra */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Kontakt
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Email:{" "}
              <Link href="mailto:example@mail.com" sx={{ color: "#fff", fontWeight: 500 }}>
                CTRLALTELITE@gmail.com
              </Link>
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              GitHub:{" "}
              <Link
                href="https://github.com/NenadBolovic/Projekat-iz-informacionih-sistema-i-baza-podataka"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: "#fff", fontWeight: 500 }}
              >
                Form Builder Repository
              </Link>
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Instagram:{" "}
              <Link
                href="https://instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: "#fff", fontWeight: 500 }}
              >
                @instagram
              </Link>
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              Verzija aplikacije: v1.0.0
            </Typography>
          </Grid>
        </Grid>

        <Divider
          sx={{
            my: 3,
            bgcolor: "rgba(255,255,255,0.25)"
          }}
        />

        <Box
          sx={{
            textAlign: "center",
            fontSize: 12,
            color: "rgba(255,255,255,0.85)"
          }}
        >
          © {year} Form Builder • Built with React & Material UI • All rights reserved.
        </Box>
      </Container>
    </Box>
  );
};

const linkStyle = {
  fontSize: 14,
  color: "rgba(255,255,255,0.85)",
  transition: "color .2s, transform .15s",
  "&:hover": {
    color: "#fff",
    transform: "translateX(3px)"
  }
};

export default Footer;