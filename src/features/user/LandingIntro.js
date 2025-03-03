import TemplatePointers from "./components/TemplatePointers";

function LandingIntro() {
  return (
    <div className="hero min-h-screen bg-gradient-to-r from-orange-500 to-yellow-400 flex justify-center items-center">
      <div className="hero-content py-12 bg-white rounded-2xl shadow-lg px-10">
        <div className="max-w-md">
          {/* Importing pointers component */}
          <TemplatePointers />
        </div>
      </div>
    </div>
  );
}

export default LandingIntro;
