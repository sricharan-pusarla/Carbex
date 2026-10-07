import { AddProjectForm } from "./add-project-form";

export default function AddProjectPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Submit a Carbon Project</h1>
        <p className="text-lg text-muted-foreground">
          List your environmental project on Carbex. Once submitted, it will undergo our automated Trust Score audit before being listed on the marketplace.
        </p>
      </div>
      
      <AddProjectForm />
    </div>
  );
}
